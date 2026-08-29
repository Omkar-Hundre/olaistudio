---
trigger: always_on
---

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

## 9. Context Window & Token Limits
- **Monitor context window size rigorously.** Before dispatching any API call to Gemini, calculate the total token count (system prompt + vision context + parent context + conversation history + user prompt). If it exceeds 80% of the model's context window, summarize older conversation turns rather than truncating the user's input. **User prompts must NEVER be truncated.**
- **Token budget allocation per request**: System prompt (max 2,000 tokens) + Global context (max 4,000 tokens) + Parent context (max 2,000 tokens) + Conversation history (dynamic, summarize if > 50,000 tokens) + User prompt (unlimited, protected).

## 10. Credit Security & Nomenclature
- **Credits use cryptographic `token_hash` (vault-salted) for tamper detection.** All deductions go through atomic `SECURITY DEFINER` stored procedures (`deduct_user_credits`). Never bypass this with direct UPDATE statements.
- **Per-node credit deduction**: Each child node API call deducts credits independently through the same secured procedure. Track `credits_consumed` on each `workflow_node` row.
- **Idempotency keys**: Every credit-consuming operation must carry an idempotency key to prevent double-deductions on retries or network failures.

## 11. Minimal API Calls & Batch Processing
- **Never make 10+ sequential API calls when 1-2 will do.** Consolidate context into a single prompt. Use Gemini's `batchGenerateContent` endpoint for parallel independent tasks (50% cost discount, async processing).
- **Memory/context updates should piggyback on existing API responses**, not trigger separate calls. The model's hidden JSON command block in its response handles state transitions — no extra round-trips.
- **Edge Function consolidation**: One edge function per logical domain (e.g., `ai-proxy` handles all AI interactions). Do not create separate functions for minor variations.

## 12. Database Transaction Safety
- **No long-running locks.** Use `SELECT ... FOR UPDATE SKIP LOCKED` for queue-based node processing. Every transaction must complete within 5 seconds or be rolled back.
- **Idempotent writes**: All database mutations must be idempotent. Use `ON CONFLICT` clauses for upserts. Use `UPDATE ... WHERE status = 'expected_status'` guards to prevent race conditions.
- **No recursive triggers**: Avoid trigger chains that can deadlock. Use application-level orchestration instead of database-level cascading triggers.

## 13. Streaming & Real-Time UI
- **Stream AI responses to the user** via Supabase Realtime (Postgres changes) or Server-Sent Events from edge functions. Never make the user wait for a full response before seeing anything.
- **Dynamic UI updates**: Use Supabase Realtime subscriptions to reflect node status changes, new child nodes, and completed outputs without page refreshes.
- **Retry on partial failure**: If a Gemini API call fails mid-stream or returns incomplete, retry automatically (max 3 attempts with exponential backoff) before showing an error. Never show truncated/partial output as final.

## 14. Hidden System Commands in AI Output
- **The AI model emits a hidden JSON command block** (fenced with `%%%SYSTEM_CMD%%%`) at the end of its response. This block is parsed by the frontend, stripped from the user-visible output, and executed as system actions (e.g., spawn child nodes, update status, propagate context changes).
- **Never display system command blocks to the user.** The frontend regex-strips them before rendering.

## 15. Background Processing & Idempotency
- **All workflow orchestration is managed via database state + edge functions.** Once a user clicks "Proceed", the workflow session is marked `executing` in the database with an idempotency key. Edge functions poll/react to pending nodes and process them.
- **Browser-independent execution**: The user can close their browser. When they return, the UI reads the current state from the database and renders the latest results. No client-side state is required for workflow progress.