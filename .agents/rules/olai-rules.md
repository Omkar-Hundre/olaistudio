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
