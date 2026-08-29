# Olai Project Rules & Constraints

Follow these strict constraints when working on the Olai project:

## 1. No Regressions (Do not break existing UI)
- **Do not modify already built things while working on new ones unless explicitly asked.** 
- Example: When applying `overflow-hidden` for border-radius effects, ensure it does not clip absolutely positioned child components (like dropdown menus). If a dropdown is getting cut off, use alternative rounding strategies (like `rounded-t-xl` on the child background) instead of clipping the parent container.

## 2. Changelog Maintenance
- **ALWAYS update the `CHANGELOG.md` file.** Every time a feature, bug fix, or architectural change is made, append a clear, concise bullet point under the current version block.

## 3. Database Synchronization
- **Run `npm run db:sync`** every time a Supabase table, policy, or function is added or modified. The `SUPABASE_SCHEMA.md` must always reflect the current database state.

## 4. Source Control
- **Always update GitHub.** After completing a task or logical chunk of work, use the terminal to `git add .`, `git commit -m "..."`, and `git push` to ensure all progress is saved and shared.

## 5. Design Constraints: Clean & Minimal
- **NO technical pills and badges** on the main UI unless absolutely required for debugging (and even then, remove them before final delivery).
- **Clean and minimal look:** NO extra unrequired borders. NO unrequired background colors. NO emojis in the UI. 
- Stick to the professional, sleek SaaS aesthetic: grayscale tokens (`slate`/`zinc`), subtle `shadow-sm`, and native Lucide icons.

## 6. No odd colors than the brand colors being used now.
- **Do not used random black adn dark colors in white theme and vice versa to create incosistency. Maintain and follow the theme based colors**

## 7. Custom credentials provided.
- ** When I provide any credentials for any platform please test those credentials first if those are working and if those are working then include it into the application.**
- ** Store them securely using superbase edge function And please don't put load over superbase if it can be done using just one function then use that one function itself instead of writing hundreds of API calls or hundreds of edge function calls for different different functions and Apis Keep the system lightweight and as fast as possible and optimized.**

## 8. All codes written should follow industry standards.
- ** All the codes that you have been writing should follow the industry standards with proper comments and structure as we have decided earlier Properly place the UI logic business logic and other logics in different different sections so that it is easier to manage and we keep the system modular and lightweight.**

## 9. Multi-Agent Architecture Rules
- **Minimal Gemini API Calls**: The model must embed all required system actions (spawn children, memory updates, propagation decisions) inside a single `OLAI_CMD` hidden JSON block within its response. No follow-up API calls for orchestration.
- **Context Window Monitoring**: Before every API call, compute approximate token count. If compiled context approaches 90% of the model's context window, summarize/compress older conversation history. **Never truncate user-facing content.**
- **No Database Locking**: All node status transitions use atomic conditional `UPDATE ... WHERE status = 'current_status' RETURNING *` writes. No blind overwrites. Each node has a unique `idempotency_key` to prevent duplicate execution.
- **Streaming via Supabase Realtime**: All AI-generated content must be streamed token-by-token to the client via Supabase Realtime subscriptions on `stream_buffer`. Users must never wait for a full response before seeing output.
- **Retry on Stall**: If the Gemini API stream stalls (no tokens for >8 seconds), the Edge Function must retry from the last checkpoint. Never show partial/failed results as the final output.
- **Background Execution**: Processing must continue server-side via Supabase Edge Functions + DB state even after browser close. On reconnect, the client must re-subscribe to Realtime and rebuild the UI from DB state.
- **Batch Processing**: For large sequential non-interactive tasks (bulk script generation, etc.), use Gemini's Batch API. The root node auto-calculates batch size based on output token limits.
- **Credit Deduction**: 1 credit is deducted per child node trigger. Use the existing `deduct_user_credits` stored procedure only. No client-side credit writes. Pre-flight check: verify `current_balance >= N` before spawning N nodes.
- **Hidden OLAI_CMD**: The model embeds a machine-readable `OLAI_CMD_START...OLAI_CMD_END` block in its output that is stripped server-side before streaming to the user. This block contains spawn instructions, memory updates, and propagation commands.
- **Change Propagation**: Minor changes (single node scope) → patch only to direct parent node. Major changes (shared contracts: APIs, schemas, design tokens, brand guidelines) → propagate to Root Node, which determines affected branches via dependency graph. Only affected leaf/middle nodes receive update prompts — unrelated nodes are never touched.
- **Smart Merge Markers**: All code-producing nodes must wrap output with `<!-- OLAI_SECTION:section-name -->` markers. All document nodes must use `<!-- OLAI_SECTION:section-name -->` with heading-level titles. The merge is a deterministic O(N) script that never reads full content.
- **Edge Function Timeout Guard**: Tasks exceeding 150 seconds (Supabase Edge Function max) must be handled via Gemini Batch API or Supabase Cron + `pg_net` queue. No single Edge Function invocation should handle unbounded sequential loops.