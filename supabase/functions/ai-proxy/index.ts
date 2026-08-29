import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// System-hosted Gemini platform API key (strictly from Edge Function environment secrets)
const PLATFORM_DEFAULT_GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      provider = "gemini",
      model = "gemini-2.5-flash",
      messages = [],
      systemPrompt = "",
      globalContext = "",
      parentContext = "",
      isPlatform = true,
      stream = false,
      responseFormat = "json",
    } = await req.json();

    // Construct full 3-level system instruction
    const combinedSystemInstruction = [
      systemPrompt?.trim() || "",
      globalContext?.trim() ? `\n\n### LEVEL 3 GLOBAL PROJECT MEMORY:\n${globalContext.trim()}` : "",
      parentContext?.trim() ? `\n\n### LEVEL 2 ACTIVE FOCUS & BRANCH MEMORY:\n${parentContext.trim()}` : "",
    ].filter(Boolean).join("\n");

    // Fetch user's custom API keys if present
    const { data: customKeys } = await supabaseClient
      .from("user_api_keys")
      .select("openai_key, claude_key, gemini_key")
      .eq("user_id", user.id)
      .maybeSingle();

    let activeApiKey = "";
    let isUserCustomKey = false;

    // Only use custom API key if user explicitly chose a BYOK model (isPlatform is false)
    if (!isPlatform) {
      if (provider === "openai" && customKeys?.openai_key) {
        activeApiKey = customKeys.openai_key;
        isUserCustomKey = true;
      } else if (provider === "claude" && customKeys?.claude_key) {
        activeApiKey = customKeys.claude_key;
        isUserCustomKey = true;
      } else if (provider === "gemini" && customKeys?.gemini_key) {
        activeApiKey = customKeys.gemini_key;
        isUserCustomKey = true;
      }
    }

    // Check balance if platform credit will be used
    if (!isUserCustomKey) {
      let { data: creditRow } = await supabaseClient
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!creditRow) {
        // Auto-initialize default credits if record missing
        await supabaseClient.rpc("initialize_user_credits", { p_user_id: user.id });
        const { data: freshRow } = await supabaseClient
          .from("user_credits")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle();
        creditRow = freshRow;
      }

      const balance = creditRow?.balance ?? 0;
      if (balance <= 0) {
        return new Response(
          JSON.stringify({
            error: "Insufficient credits. Please add your own API key in Settings to continue.",
            balance: 0,
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (provider === "gemini") {
        activeApiKey = PLATFORM_DEFAULT_GEMINI_KEY || customKeys?.gemini_key || "";
      } else if (provider === "openai") {
        activeApiKey = Deno.env.get("OPENAI_API_KEY") || customKeys?.openai_key || "";
      } else if (provider === "claude") {
        activeApiKey = Deno.env.get("ANTHROPIC_API_KEY") || customKeys?.claude_key || "";
      }
    }

    if (!activeApiKey) {
      return new Response(
        JSON.stringify({
          error: `No API key available for provider '${provider}'. Please configure your key in Settings or set GEMINI_API_KEY in Edge Function secrets.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // STREAMING MODE (Server-Sent Events)
    // =========================================================================
    if (stream) {
      if (provider === "gemini") {
        const geminiContents: any[] = [];

        // Build clean conversation turns (excluding system messages from contents)
        messages.forEach((m: any) => {
          if (m.role === "system") return;
          geminiContents.push({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
          });
        });

        // If no user message was provided, add minimal prompt
        if (geminiContents.length === 0) {
          geminiContents.push({
            role: "user",
            parts: [{ text: "Hello! Let's begin." }],
          });
        }

        const generationConfig: any = {
          response_mime_type: "application/json",
          response_schema: {
            type: "OBJECT",
            properties: {
              greeting: { type: "STRING" },
              suggested_title: { type: "STRING" },
              confidence_score: { type: "INTEGER" },
              current_branch: { type: "STRING" },
              ready_for_vision: { type: "BOOLEAN" },
              cta_label: { type: "STRING" },
              questions: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    question: { type: "STRING" },
                    options: {
                      type: "ARRAY",
                      items: { type: "STRING" }
                    }
                  },
                  required: ["id", "question", "options"]
                }
              },
              plan_markdown: { type: "STRING" }
            },
            required: ["greeting", "confidence_score", "ready_for_vision", "plan_markdown"]
          },
          temperature: 0.7,
        };

        const candidateModels = Array.from(new Set([model, "gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest"]));
        let upstreamRes: Response | null = null;
        let lastErrText = "";

        for (const candidate of candidateModels) {
          const candidateGenConfig = { ...generationConfig };
          if (candidate === "gemini-2.5-flash") {
            candidateGenConfig.thinking_config = { thinking_budget: 0 };
          } else {
            delete candidateGenConfig.thinking_config;
          }

          const candidateReqBody: any = {
            contents: geminiContents,
            generationConfig: candidateGenConfig,
          };

          if (combinedSystemInstruction && combinedSystemInstruction.trim()) {
            candidateReqBody.system_instruction = {
              parts: [{ text: combinedSystemInstruction.trim() }],
            };
          }

          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:streamGenerateContent?alt=sse&key=${activeApiKey}`;
          upstreamRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidateReqBody),
          });

          if (upstreamRes.ok) {
            break;
          } else {
            lastErrText = await upstreamRes.text();
            if (upstreamRes.status === 429 || upstreamRes.status === 503 || upstreamRes.status === 404 || upstreamRes.status === 400) {
              continue;
            } else {
              break;
            }
          }
        }

        if (!upstreamRes || !upstreamRes.ok) {
          return new Response(JSON.stringify({ error: `Gemini API error: ${lastErrText}` }), {
            status: upstreamRes ? upstreamRes.status : 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Deduct credit only after upstream call is verified 200 OK
        let remainingBalance = 100;
        if (!isUserCustomKey) {
          const { data: deductResult } = await supabaseClient.rpc("deduct_user_credits", {
            p_amount: 1,
            p_user_id: user.id,
          });
          if (deductResult?.balance !== undefined) {
            remainingBalance = deductResult.balance;
          }
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const raw = decoder.decode(chunk, { stream: true });
            const lines = raw.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const jsonStr = line.replace("data: ", "").trim();
                  if (!jsonStr) continue;
                  const parsed = JSON.parse(jsonStr);
                  const deltaText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                  if (deltaText) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ delta: deltaText, creditsRemaining: remainingBalance })}\n\n`)
                    );
                  }
                } catch {
                  // ignore
                }
              }
            }
          },
          flush(controller) {
            controller.enqueue(encoder.encode(`data: [DONE]\n\n`));

            supabaseClient.from("activity_logs").insert({
              user_id: user.id,
              action: isUserCustomKey ? "Stream Chat (Custom Key)" : "Stream Chat (Platform Credit)",
              model: `${provider}/${model}`,
              credits_used: isUserCustomKey ? 0 : 1,
              details: {
                provider,
                model,
                used_user_key: isUserCustomKey,
                messages_count: messages.length,
                stream: true,
              },
            }).catch(() => {});
          }
        });

        return new Response(upstreamRes.body?.pipeThrough(transformStream), {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      } else {
        // OpenAI / Claude streaming fallback
        const openaiMessages = [...messages];
        if (systemPrompt && systemPrompt.trim()) {
          openaiMessages.unshift({ role: "system", content: systemPrompt.trim() });
        }

        const openaiUrl = "https://api.openai.com/v1/chat/completions";
        const upstreamRes = await fetch(openaiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeApiKey}`,
          },
          body: JSON.stringify({
            model: model.startsWith("gpt") ? model : "gpt-4o",
            messages: openaiMessages,
            stream: true,
            response_format: { type: "json_object" },
          }),
        });

        if (!upstreamRes.ok) {
          const err = await upstreamRes.text();
          return new Response(JSON.stringify({ error: `OpenAI API error: ${err}` }), {
            status: upstreamRes.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        let remainingBalance = 100;
        if (!isUserCustomKey) {
          const { data: deductResult } = await supabaseClient.rpc("deduct_user_credits", {
            p_amount: 1,
            p_user_id: user.id,
          });
          if (deductResult?.balance !== undefined) {
            remainingBalance = deductResult.balance;
          }
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const raw = decoder.decode(chunk, { stream: true });
            const lines = raw.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const dataVal = line.replace("data: ", "").trim();
                if (dataVal === "[DONE]") {
                  controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
                  continue;
                }
                try {
                  const parsed = JSON.parse(dataVal);
                  const deltaText = parsed.choices?.[0]?.delta?.content || "";
                  if (deltaText) {
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ delta: deltaText, creditsRemaining: remainingBalance })}\n\n`)
                    );
                  }
                } catch {
                  // ignore
                }
              }
            }
          },
          flush() {
            supabaseClient.from("activity_logs").insert({
              user_id: user.id,
              action: isUserCustomKey ? "Stream Chat (Custom Key)" : "Stream Chat (Platform Credit)",
              model: `${provider}/${model}`,
              credits_used: isUserCustomKey ? 0 : 1,
              details: {
                provider,
                model,
                used_user_key: isUserCustomKey,
                messages_count: messages.length,
                stream: true,
              },
            }).catch(() => {});
          }
        });

        return new Response(upstreamRes.body?.pipeThrough(transformStream), {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        });
      }
    }

    // =========================================================================
    // SYNCHRONOUS MODE
    // =========================================================================
    let reply = "";
    if (provider === "gemini") {
      const geminiContents: any[] = [];
      messages.forEach((m: any) => {
        if (m.role === "system") return;
        geminiContents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
        });
      });

      const syncGenerationConfig: any = {
        response_mime_type: "application/json",
        response_schema: {
          type: "OBJECT",
          properties: {
            greeting: { type: "STRING" },
            suggested_title: { type: "STRING" },
            confidence_score: { type: "INTEGER" },
            current_branch: { type: "STRING" },
            ready_for_vision: { type: "BOOLEAN" },
            cta_label: { type: "STRING" },
            questions: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING" },
                  question: { type: "STRING" },
                  options: {
                    type: "ARRAY",
                    items: { type: "STRING" }
                  }
                },
                required: ["id", "question", "options"]
              }
            },
            plan_markdown: { type: "STRING" }
          },
          required: ["greeting", "confidence_score", "ready_for_vision", "plan_markdown"]
        },
        temperature: 0.7,
      };

      const candidateModels = Array.from(new Set([model, "gemini-3.6-flash", "gemini-2.5-flash", "gemini-flash-latest"]));
      let geminiRes: Response | null = null;
      let lastErrText = "";

      for (const candidate of candidateModels) {
        const candidateSyncConfig = { ...syncGenerationConfig };
        if (candidate === "gemini-2.5-flash") {
          candidateSyncConfig.thinking_config = { thinking_budget: 0 };
        } else {
          delete candidateSyncConfig.thinking_config;
        }

        const candidateReqBody: any = {
          contents: geminiContents,
          generationConfig: candidateSyncConfig,
        };

        if (combinedSystemInstruction && combinedSystemInstruction.trim()) {
          candidateReqBody.system_instruction = {
            parts: [{ text: combinedSystemInstruction.trim() }],
          };
        }

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${candidate}:generateContent?key=${activeApiKey}`;
        geminiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidateReqBody),
        });

        if (geminiRes.ok) {
          break;
        } else {
          lastErrText = await geminiRes.text();
          if (geminiRes.status === 429 || geminiRes.status === 503 || geminiRes.status === 404 || geminiRes.status === 400) {
            continue;
          } else {
            break;
          }
        }
      }

      if (!geminiRes || !geminiRes.ok) {
        return new Response(JSON.stringify({ error: `Gemini API error: ${lastErrText}` }), {
          status: geminiRes ? geminiRes.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiData = await geminiRes.json();
      reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const openaiMessages = [...messages];
      if (combinedSystemInstruction && combinedSystemInstruction.trim()) {
        openaiMessages.unshift({ role: "system", content: combinedSystemInstruction.trim() });
      }

      const openaiUrl = "https://api.openai.com/v1/chat/completions";
      const openaiRes = await fetch(openaiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify({
          model: model.startsWith("gpt") ? model : "gpt-4o",
          messages: openaiMessages,
          response_format: { type: "json_object" },
        }),
      });

      if (!openaiRes.ok) {
        const err = await openaiRes.text();
        return new Response(JSON.stringify({ error: `OpenAI API error: ${err}` }), {
          status: openaiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const openaiData = await openaiRes.json();
      reply = openaiData.choices?.[0]?.message?.content || "";
    }

    // Deduct credit only on verified 200 OK response
    let remainingBalance = 100;
    if (!isUserCustomKey) {
      const { data: deductResult } = await supabaseClient.rpc("deduct_user_credits", {
        p_amount: 1,
        p_user_id: user.id,
      });
      if (deductResult?.balance !== undefined) {
        remainingBalance = deductResult.balance;
      }
    }

    await supabaseClient.from("activity_logs").insert({
      user_id: user.id,
      action: isUserCustomKey ? "Chat Request (Custom Key)" : "Chat Request (Platform Credit)",
      model: `${provider}/${model}`,
      credits_used: isUserCustomKey ? 0 : 1,
      details: {
        provider,
        model,
        used_user_key: isUserCustomKey,
        messages_count: messages.length,
      },
    });

    return new Response(
      JSON.stringify({
        reply,
        creditsRemaining: remainingBalance,
        usedUserKey: isUserCustomKey,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
