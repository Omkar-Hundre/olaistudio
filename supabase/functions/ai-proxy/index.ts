import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLATFORM_DEFAULT_GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") || "";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { provider = "gemini", model = "gemini-2.5-flash", messages = [], systemPrompt = "" } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: customKeys } = await supabaseClient
      .from("user_api_keys")
      .select("openai_key, claude_key, gemini_key")
      .eq("user_id", user.id)
      .maybeSingle();

    let activeApiKey = "";
    let isUserCustomKey = false;

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

    let creditsRemaining = 100;
    let creditsDeducted = 0;

    if (!isUserCustomKey) {
      const { data: deductResult, error: deductError } = await supabaseClient.rpc("deduct_user_credits", {
        p_amount: 1,
      });

      if (deductError || !deductResult?.success) {
        return new Response(
          JSON.stringify({
            error: "Insufficient credits. Please add your own API key in Settings to continue.",
            balance: deductResult?.balance ?? 0,
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      creditsRemaining = deductResult.balance;
      creditsDeducted = 1;

      if (provider === "gemini") {
        activeApiKey = PLATFORM_DEFAULT_GEMINI_KEY;
      } else if (provider === "openai") {
        activeApiKey = Deno.env.get("OPENAI_API_KEY") || "";
      } else if (provider === "claude") {
        activeApiKey = Deno.env.get("ANTHROPIC_API_KEY") || "";
      }
    }

    if (!activeApiKey) {
      return new Response(
        JSON.stringify({
          error: `No API key available for provider '${provider}'. Please configure your key in Settings.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let reply = "";
    if (provider === "gemini") {
      const geminiContents = [];

      // System instruction / prompt support
      if (systemPrompt && systemPrompt.trim()) {
        geminiContents.push({
          role: "user",
          parts: [{ text: `[SYSTEM INSTRUCTION]\n${systemPrompt.trim()}` }],
        });
        geminiContents.push({
          role: "model",
          parts: [{ text: "Understood. I will strictly follow these system instructions." }],
        });
      }

      messages.forEach((m: any) => {
        geminiContents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: typeof m.content === "string" ? m.content : JSON.stringify(m.content) }],
        });
      });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${activeApiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: geminiContents }),
      });

      if (!geminiRes.ok) {
        const err = await geminiRes.text();
        return new Response(JSON.stringify({ error: `Gemini API error: ${err}` }), {
          status: geminiRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const geminiData = await geminiRes.json();
      reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      const openaiMessages = [...messages];
      if (systemPrompt && systemPrompt.trim()) {
        openaiMessages.unshift({ role: "system", content: systemPrompt.trim() });
      }

      const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${activeApiKey}`,
        },
        body: JSON.stringify({
          model: model.includes("gpt") ? model : "gpt-4o-mini",
          messages: openaiMessages,
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

    // Auto-record log in activity_logs
    await supabaseClient.from("activity_logs").insert({
      user_id: user.id,
      action: isUserCustomKey ? "Chat (Custom Key)" : "Chat (Platform Credit)",
      model: `${provider}/${model}`,
      credits_used: creditsDeducted,
      details: {
        provider,
        model,
        used_user_key: isUserCustomKey,
        messages_count: messages.length,
      },
    }).catch(() => {});

    return new Response(
      JSON.stringify({
        reply,
        creditsRemaining,
        usedUserKey: isUserCustomKey,
        model,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
