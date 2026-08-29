# Changelog

All notable changes to the **Olai** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.9.0] - 2026-08-29

### Added
- **Questionnaire Modal Separation & "Simplify Questions" Action (`QuestionnaireCard.jsx`, `ChatWorkspace.jsx`)**:
  - Automatically stripped inline questionnaire text lists from message bubbles so questions only render inside the interactive modal.
  - Added "Didn't understand? Simplify 💡" button allowing users to request simpler, plain English explanations with 1 click.
  - Removed all standalone progress indicators while streaming so alignment meter and skip actions only appear inside the questionnaire modal once generation is complete.
- **Industrial-Grade JSON & Questionnaire Parser (`systemCommandParser.js`)**:
  - Engineered resilient multi-pass JSON cleanser that handles markdown code fences, unescaped characters, trailing commas, and formatting errors.
  - Implemented automatic question structure recovery with text extraction fallback so questionnaire tiles are guaranteed to render cleanly.
  - Guaranteed zero credit wastage with instant database persistence for all prompt and response turns.
- **Resilient Chat Switching & Automatic Titling (`ChatWorkspace.jsx`, `systemCommandParser.js`)**:
  - Fixed chat switching from sidebar by querying root node turns ordered by depth from `workflow_nodes`.
  - Implemented automatic fallback titling so conversations are always named from the first turn even if LLM JSON is wrapped in code fences.
  - Eradicated all client-side stale API key caching in `apiKeyService.js` to ensure 100% live synchronization from Supabase.
- **Database Session Persistence & Sidebar History Integration (`AppDashboard.jsx`, `workflowService.js`)**:
  - Connected `public.workflow_sessions` and `workflow_nodes` root turns to persist conversation history, questions, and alignment progress across page refreshes.
  - Connected `Sidebar.jsx` recent chats list with live selection and instant `+ New Chat` reset.
  - Rebuilt `QuestionnaireCard.jsx` with responsive 2x2 selectable tiles, top integrated alignment score (35% $\rightarrow$ 85%+), and "Skip & Build" button.
  - Auto-invalidated stale client-side API key caches in `apiKeyService.js`.
- **UI Theme Refinements & Inline Alignment Bar (`ChatWorkspace.jsx`)**:
  - Replaced pitch black `#000000` with comfortable dark obsidian slate (`#13151A`, surfaces `#1A1D24` / `#1E222B`).
  - Fixed light theme user bubbles to use soft slate (`bg-slate-100 border-slate-200`) instead of harsh black.
  - Expanded conversation width to full-width canvas (`max-w-5xl`).
  - Moved Alignment Progress Bar and "Skip & Build Anyway ⚡" inline below the prompt and response.
  - Added one-click **Retry** button with zero credit deduction on failed API responses.
  - Synchronized Gemini API key in `user_api_keys` and deployed `ai-proxy` v7 with atomic credit deduction strictly on 200 OK responses.
- **AI Jargon Elimination & Single-Word Action Buttons (Rule 16)**:
  - Added strict project Rule 16 forbidding AI technical jargon (e.g. "multi-level execution graph", "DAG", "orchestration payload") in user-facing UI and messages.
  - Enforced single-word clean action buttons (e.g., "Cook", "Build", "Start", "Begin", "Submit").
  - Simplified copy across `VisionCard.jsx`, `QuestionnaireCard.jsx`, and `workspace_modes` system prompts.
- **Interactive 4-Option Questionnaire Stepper (`QuestionnaireCard.jsx`)**:
  - Implemented 1-question-at-a-time interactive stepper containing 3 tailored structured options + 1 custom write-in input box.
  - Added smooth Back/Next navigation and single-turn consolidated submission to minimize API token calls.
  - Built `VisionCard.jsx` displaying the synthesized Master Vision with copy support and dynamic action button (`cta_label` e.g., "Cook & Build ⚡", "Begin Execution 🚀").
- **Mother Agent "Grill-Me" Interview Engine & Alignment UI (`ChatWorkspace.jsx`)**:
  - Authored and seeded Mother Agent system prompts across all 4 modes in `public.workspace_modes` (35% baseline score, 1-2 focused questions, hidden `%%%SYSTEM_CMD%%%` block).
  - Built a minimal, borderless sticky Alignment Progress Bar with spring fill animation from 35% $\rightarrow$ 85%+.
  - Added "Skip & Build Anyway ⚡" escape hatch button to trigger instant Vision synthesis.
  - Implemented `systemCommandParser.js` to strip technical metadata from the user chat bubble and auto-update session title and confidence in the database.
- **Relational DAG Workflow Engine (`public.workflow_sessions`, `workflow_nodes`, `workflow_node_dependencies`)**:
  - Implemented core database architecture for multi-level hierarchical workflows with Mother Agent root node (`depth = 0`) and child worker nodes (`depth >= 1`).
  - Added `merge_output` JSONB column in `workflow_sessions` for final output synthesis.
  - Implemented Level 3 permanent memory storage (`conversation_history` JSONB) and per-node credit tracking (`credits_consumed`).
  - Added strict Row Level Security (RLS) policies enforcing multi-tenant isolation through session ownership.
  - Built `workflowService.js` client wrapper with real-time Supabase subscription integration.
- **Real-Time Typewriter Response Streaming (`ai-proxy` v6 & `ChatWorkspace.jsx`)**:
  - Implemented Server-Sent Events (SSE) streaming support across Google Gemini (`streamGenerateContent`) and OpenAI in the `ai-proxy` Edge Function.
  - Added `sendStreamingProxyChatMessage` in `aiProxyService.js` and connected live typewriter rendering with animated cursor in `ChatWorkspace.jsx`.
  - Enforced upfront authentication and atomic credit deduction via `deduct_user_credits` prior to stream initialization.
- **Token Budget Calculator & Context Window Guard (`tokenBudget.js`)**:
  - Implemented client-side context window monitor strictly enforcing Rule 9 across all model providers (`gemini-2.5-flash` 1M, `gpt-4o` 128k, `claude-3-5-sonnet` 200k).
  - Guarantees user prompts are 100% protected and never truncated under any condition.
  - Automatically summarizes older conversation turns into structured digests when payload exceeds 80% ceiling or 50,000 tokens.
- **Edge Function Secret Lockdown**:
  - Audited all serverless Edge Functions (`ai-proxy`, `s3-upload-url`) to strictly consume environment secrets via `Deno.env.get(...)` with zero plaintext fallback exposure.
- **Project Snapshot & Multi-Tier Backup**:
  - Created standalone remote backup branch `backup-stable-v2.9` and Git release tag `v2.9.0-stable` on GitHub.
  - Generated full local workspace archive `olai-backup-v2.9.0.zip` safeguarding all stable code prior to Mother Agent multi-node workflow integration.
- **Platform Gemini Key & Edge Function Deployment (v5)**:
  - Verified and deployed new Google Gemini API key to the active serverless `ai-proxy` Edge Function container.
  - Sanitized local repository code to prevent secret scanner alerts while maintaining full runtime operational capability.
  - Upgraded default `Olai M1` model to `gemini-2.5-flash` in `public.platform_models` table.
- **Secure AWS S3 Integration via Edge Function**:
  - Built a secure Supabase Edge Function (`s3-upload-url`) to generate pre-signed upload URLs, fully decoupling AWS secrets from the frontend bundle.
  - Implemented `s3Service.js` to execute Just-In-Time (JIT) uploads to the `olai` bucket exactly when the user clicks "Send", rather than blindly uploading upon attachment.
- **Client-Side File Parsing (`fileParser.js`)**:
  - Implemented local extraction of text from code and markdown files via `FileReader`.
  - Injects parsed file text directly into the AI context for immediate reasoning.
- **Dynamic Platform Models (`public.platform_models`)**:
  - Migrated hardcoded platform models (e.g. `Olai M1`) to the Supabase database.
  - Implemented `platformModelService.js` to securely fetch and cache these models dynamically on mount, preventing the need for client deployments when changing default backend models.
- **AI Proxy Hardening & UI Boundaries**:
  - Implemented a generous `32,000` character ceiling on the prompt `<textarea>` inside `ChatWorkspace.jsx` to prevent Edge Function memory overload.
  - Added a smart character counter (`[Length] / 32,000`) that elegantly fades into the bottom right only when surpassing 25,000 characters.
- **Agent Governance Rules**:
  - Established `.agents/rules/olai-rules.md` dictating strict agent guidelines on UI regression prevention, changelog maintenance, database syncing, and enforcing a minimal, borderless SaaS aesthetic without technical badges.
- **Purpose-Driven Workspace Modes (`ChatWorkspace.jsx`)**:
  - Implemented 4 core modes (Deep Research, Product Planning, Design & Architecture, Task Execution) to structure AI interactions.
  - Added an attached full-width top gradient mode bar displaying the active mode context with a clean `✕` dismiss button.
  - Added dynamic context-aware placeholder animations depending on the selected mode.
- **Dynamic Mode-Specific Prompt Suggestions**:
  - Attached a sleek borderless vertical stack below the chat composer containing 3 highly targeted, accessible task suggestions for the active mode.
- **Supabase System Prompts Database (`public.workspace_modes`)**:
  - Created and seeded a `workspace_modes` table in Supabase protected by Row Level Security (RLS).
  - Drafted 4 comprehensive, persona-driven system prompts detailing instructions on output format, verification, comparison matrices, PRD structuring, and atomic task execution.
- **Dynamic AI Proxy Dispatch (`workspaceModeService.js` & `aiProxyService.js`)**:
  - Modes and system prompts are now dynamically fetched and cached from Supabase on mount.
  - When an active mode is selected, its respective rigorous `systemPrompt` is injected seamlessly into the backend AI proxy.
- **Liquid Gradient Flow Border Animation**:
  - Wrapped the main chat composer in a flowing, continuous random liquid gradient border (`@keyframes liquidFlow`).

### Changed
- **Clean Aesthetic Overhauls**:
  - Removed clunky borders, subtitle texts, and background icon pills from the mode cards and suggestion components to achieve a minimalist, human-designed aesthetic.
  - Pixel-perfect vertical baseline alignment of the Sparkle logo, text input field, and floating placeholders.

## [2.8.0] - 2026-08-29

### Changed
- **Model Subtitles Restored**:
  - Replaced the boring or credit-based tags in the model selection dropdown with professional technical indicators:
    - *Olai M1*: `Default • High-speed platform intelligence`
    - *Gemini*: `Custom Key • Google AI Ultra-low latency`
    - *OpenAI*: `Custom Key • OpenAI Core Reasoning`
    - *Claude*: `Custom Key • Anthropic Frontier Accuracy`
- **Textarea Resize & Scrollbar**:
  - Implemented dynamic React hooks to recalculate the height of the prompt composer input during text edits, deletions, pastes, and backspaces.
  - Added a max-height limit of `180px` coupled with a custom, sleek scrollbar class (`custom-scrollbar`) to prevent irregular expansions or layout inconsistencies.
- **Vertical Alignment**:
  - Adjusted top flex offsets and paddings to align the Sparkles icon and the first line of the prompt input text baseline.

---

## [2.7.0] - 2026-08-29

### Changed
- **Sidebar Navigation**:
  - Replaced the *Leaderboard* nav button with a clean *Templates* page shortcut link (`Compass` icon).
- **Header Clean Up**:
  - Removed the *Mode ▾* selector dropdown button from the top left header bar to clean up workspace clutter.
- **Model Selection Details**:
  - Cleaned up custom model dropdown descriptions by removing the `"Custom Key (0 credits)"` metadata, ensuring only the credit-backed `Olai M1` model displays cost details.

---

## [2.6.0] - 2026-08-28

### Added
- **Git Control & Repository Initialization**:
  - Initialized local Git repository, configured branch tracking, and pushed all source code to `origin/main` (`https://github.com/Omkar-Hundre/olaistudio.git`).
- **Standardized Ignored Paths (`.gitignore`)**:
  - Updated configuration to ignore local environments (`.env*`), builds (`dist/`), packages (`node_modules/`), IDE workspace configurations, and Vercel artifacts for secure code collaboration.

---

## [2.5.0] - 2026-08-28

### Added
- **Frontier / Arena UI Layout Alignment**:
  - Styled center headline with italic serif typography: `Experience the frontier`.
  - Implemented 6 quick-start template cards grid (*Create a landing page*, *Build a dashboard*, *Make a game*, *Design to Code*, *Build a fullstack app*, *Launch a storefront*) with instant prompt auto-population.
  - Implemented the input box toolbar pills (*App files*, *⚡ Olai M1*, *...*) and send button.
  - Added the floating bottom-right YouTube / community callout card with dismissal option.
  - Aligned the top header with Mode dropdown, announcement banner, and Private badge.
  - Reorganized sidebar with brand selector, `+ New Chat` pill button, Leaderboard, Search, Workspace, and bottom credits percentage ring.

---

## [2.4.0] - 2026-08-28

### Added
- **Full Model Discovery in Workspace (`ChatWorkspace.jsx`)**:
  - Dynamically runs health checks to discover and populate all verified models for connected keys (e.g. `Gemini 2.5 Pro`, `Gemini 2.5 Flash`, `Gemini 2.0 Flash`, `Gemini 1.5 Pro`, `Gemini 1.5 Flash`, `OpenAI GPT-4o`, `Claude 3.5 Sonnet`).
  - Maintains `Olai M1` as the default model using API credits.
- **Centered Initial Prompt Layout**:
  - Positions the prompt composer in the exact vertical and horizontal center of the viewport on initial empty state.
- **Bright Fluid Liquid Glowing Aura**:
  - Added an animated, vibrant iridescent gradient glow around the input box with fluid spinning and pulsing motion.
- **Animated Rotating Placeholders**:
  - Added rotating placeholder animations with smooth fade transitions.
- **Click-Outside Focus & Dropdown Dismissal**:
  - Dropdown closes automatically when clicking anywhere outside.

---

## [2.3.0] - 2026-08-28

### Added
- **Central Chat Workspace (`ChatWorkspace.jsx`)**:
  - Implemented center prompt composer with fluid, semi-solid flowing gradient animation (`animate-fluid-1`, `animate-fluid-2`).
  - Added file/image attachment trigger with chip previews.
  - Added dynamic model selection dropdown:
    - **`Olai M1`**: Default model backed by system credits (1 credit/query).
    - **User Custom Models**: Dynamically populated from user's connected OpenAI, Claude, or Gemini API keys (0 credits).
  - Built interactive conversational message stream with copy tools and real-time proxy dispatch.
  - Linked credit deduction trigger with sidebar credit progress ring.

---

## [2.2.0] - 2026-08-28

### Added
- **Activity Logs & Audit Tracking (`public.activity_logs`)**:
  - Implemented database table (`id`, `user_id`, `action`, `model`, `credits_used`, `details`, `created_at`) with strict RLS.
  - Connected `ai-proxy` Edge Function to automatically record every AI completion and credit transaction.
  - Added live activity logs viewer with timestamps and credit delta badges in Settings modal (`SettingsModal.jsx`).
- **Configured Serverless AI Proxy Platform Key**:
  - Configured platform Google Gemini key inside the serverless `ai-proxy` Edge Function (version 2) protecting backend credentials.
- **Sleek Sliding Pill Theme Switcher (`ThemePillSwitch`)**:
  - Replaced the simple icon button in the dashboard navbar with a modern sliding pill toggle with smooth spring transitions.

### Changed
- **Credits Widget Percentage-Only Display (`Sidebar.jsx`)**:
  - Streamlined sidebar credit widget to show only the clean percentage and circular SVG ring, removing raw numbers.

---

## [2.1.0] - 2026-08-28

### Added
- **Secure Serverless AI Proxy (`ai-proxy` Edge Function)**:
  - Deployed active Supabase Edge Function with JWT verification protecting system credentials.
  - Automatically executes requests using the user's custom API key (0 credit deduction) if configured, or falls back to system credentials with atomic 1-credit deduction.
  - Rejects requests when credit balance is exhausted ($< 1$) with code 402.
  - Client interface implemented in `aiProxyService.js`.
- **Monochrome Circular Progress Ring for Credits (`Sidebar.jsx`)**:
  - Replaced the horizontal bar with a circular SVG progress ring in neutral light/dark theme colors.
  - Removed all bright/yellow colors and emojis for a clean SaaS aesthetic.

---

## [2.0.0] - 2026-08-28

### Added
- **Cryptographically Secured Credit System (`public.user_credits`)**:
  - Implemented a dedicated database table (`id`, `user_id`, `balance`, `allocated_credits`, `used_credits`, `tier`, `token_hash`, `last_refill_at`).
  - Row Level Security (RLS) restricts client permissions to read-only (`SELECT`), strictly prohibiting direct frontend balance manipulation.
  - Credit adjustments and deductions are managed exclusively via atomic `SECURITY DEFINER` stored procedures (`deduct_user_credits`, `initialize_user_credits`).
  - Implemented cryptographic signature token hashing (`token_hash`) with vault salting for tamper detection.
  - Automatically initializes 100 credits for all new and existing registered user accounts.
- **Real-Time Credits Widget in Sidebar (`Sidebar.jsx`)**:
  - Added a clean, compact credit card widget positioned right above the Settings tab showing current balance (`100 / 100`) and a progress bar.

### Changed
- **Redesigned Settings Modal Mobile Architecture (`SettingsModal.jsx`)**:
  - Replaced awkward horizontal scrolling tabs on mobile with a clean, native drop selector with zero overflow and touch-friendly navigation.
  - Retained the desktop two-column sidebar layout for screens $\ge 768\text{px}$.

---

## [1.9.0] - 2026-08-28

### Changed
- **Compact API Key Input UI (`SettingsModal.jsx`)**:
  - Reverted bulky card containers back to the clean, streamlined standard input layout.
  - Placed the "Test" button and visibility eye toggle inline inside the right edge of each input box.
  - Replaced bulky status badges with subtle text indicators (`✓ Verified (X models available)` + collapsible model list).
  - Automatically saves the key in the database upon successful verification.

---

## [1.8.0] - 2026-08-28

### Added
- **Live Model Health Check & API Key Verification (`modelHealthService.js`)**:
  - Automatically queries OpenAI, Anthropic Claude, and Google Gemini endpoints upon key entry/blur/test.
  - Verifies key validity and dynamically discovers available models (e.g. `gpt-4o`, `o3-mini`, `claude-3-7-sonnet`, `gemini-2.0-flash`).
  - Displays instant status indicators (🟢 Verified, 🔴 Invalid with detailed error reason, ⏳ Checking models).
  - Expandable chip previews of all discovered models per provider.
- **Fully Responsive Settings Modal (`SettingsModal.jsx`)**:
  - Designed for mobile phones, tablets, and desktop displays (`h-[92vh]` on mobile / `h-[620px]` on desktop).
  - Mobile horizontal scrollable tab switcher with touch-optimized padding and full-width card layout.

---

## [1.7.0] - 2026-08-28

### Added
- **Dark Mode Logo (`Olai Logo Dark.png`)**:
  - Automatically switches between `/Olai Logo.png` (light mode) and `/Olai Logo Dark.png` (dark mode) across Navbar, Sidebar, and AuthModal via `useTheme().logoSrc`.
- **Secure User API Keys Table (`public.user_api_keys`)**:
  - Created dedicated Supabase table (`id`, `user_id`, `openai_key`, `claude_key`, `gemini_key`, `created_at`, `updated_at`) with strict Row Level Security (RLS).
  - Only authenticated owners can read, insert, update, or delete their keys (`auth.uid() = user_id`).
- **API Key Service & 24h Local Cache (`apiKeyService.js`)**:
  - Provides seamless cloud sync with Supabase and local storage caching refreshed on a 24-hour cycle.
  - Fully integrated with the Settings modal "Models & API Keys" tab with instant feedback.

### Fixed
- **Tailwind v4 Class-Based Dark Mode**:
  - Added `@custom-variant dark (&:where(.dark, .dark *));` to `src/index.css` resolving class-based dark mode toggling.
  - Enhanced `ThemeContext.jsx` to guarantee immediate DOM synchronization and persistent local storage restoration across visits.

---

## [1.6.0] - 2026-08-28

### Added
- **Global Theme System & Tokens (`ThemeContext.jsx` & `index.css`)**:
  - Implemented semantic CSS design tokens under `:root` and `.dark` / `[data-theme="dark"]` for colors, surfaces, borders, and typography.
  - Added support for Light, Dark, and OS System preferences with persistent storage (`olai_theme`).
  - Automatic synchronization with `document.documentElement` class list and `color-scheme`.
- **Functioning Theme Toggles (`ThemeToggle.jsx`)**:
  - `ThemeToggleButton`: Sleek, compact Sun/Moon icon toggle button placed in the top dashboard navbar.
  - `ThemeSegmentedSelector`: 3-way segmented selector (Light / Dark / System) placed in the Settings dialog under "Appearance & Theme".
- **Dark Mode Support Across Authenticated Workspace**:
  - Styled `AppDashboard.jsx`, `Sidebar.jsx`, and `SettingsModal.jsx` with high-contrast, professional dark mode tokens.

---

## [1.5.0] - 2026-08-28

### Added
- **Centralized Settings Dialog (`SettingsModal.jsx`)**:
  - Consolidates profile management, AI Models & API Keys, Knowledge Base, and Activity Logs into a single modal.
  - Can be opened via the sidebar's bottom Settings button, the sidebar profile card, or the top-right navbar profile circle.
- **Top-Right Profile Circle**:
  - Added user initials avatar circle on the top-right corner of the dashboard navbar that triggers the Settings modal.
- **Previous Projects Section in Sidebar**:
  - Added "Previous Projects" section underneath the workspace navigation with real state binding (no dummy clutter).
  - Placed "New Chat" button prominently at the top.

### Changed
- **Sidebar Streamlining**:
  - Moved system navigation options into the single Settings trigger at the bottom of the sidebar.
  - Kept the workspace options intact.
- **Removed Loading Animation**:
  - Removed artificial pulsing logo and loading progress bar from `App.jsx` for clean instantaneous mounting.

---

## [1.4.0] - 2026-08-28

### Changed
- **Professional Sidebar Redesign (`Sidebar.jsx`)**:
  - Replaced over-rounded toy-like radiuses with clean, crisp `rounded-md` / `rounded-lg` geometry.
  - Refined vertical rhythm and item padding for a modern, sleek developer-tool aesthetic (Linear / Stripe style).
  - Organized navigation into clear sections (`Workspace` and `System`) with subtle tracking labels.
  - Streamlined user profile footer with clean avatar, typography, and one-click logout.
- **Removed AI & Technical Badges**:
  - Removed the green "Ready" badge from the dashboard header.
  - Removed "JWT Session Active" badge from the sidebar.
  - Removed "Supabase RLS & JWT Auth Active" footer tag.
- **Clean Empty Workspace Layout (`AppDashboard.jsx`)**:
  - Removed the premature canvas dot grid, canvas zoom dock, and starter cards.
  - Maintained a serene, minimal empty workspace container ready for modular features.

---

## [1.3.0] - 2026-08-28

### Added
- **Responsive Workspace Screen (`AppDashboard.jsx`)**:
  - Automatically rendered when a user logs in (`isAuthenticated === true`).
  - Spatial canvas dot grid background (`radial-gradient` pattern).
  - Floating zoom, pan, select, and view-reset toolbar dock.
  - Interactive starter cards ("Blank Node Canvas", "Connect AI Providers").
- **Collapsible Responsive Sidebar (`Sidebar.jsx`)**:
  - Seamless desktop expand/collapse mode and mobile slide-over drawer.
  - Official Olai logo branding (`/Olai Logo.png`).
  - Navigation links for Canvas, Templates, AI Models, Memory, Logs, and Settings.
  - Active 7-Day JWT session indicator badge and user profile with logout.
- **7-Day Session Lifecycle & Idempotency Key**:
  - Implemented custom auth storage wrapper in `supabase.js` enforcing a 7-day session expiration TTL (`SESSION_MAX_AGE_MS = 604800000`).
  - Added `generateIdempotencyKey()` for deduplication and atomic operations.
- **Database Security Hardening & Normalization**:
  - Set explicit `search_path` on all PostgreSQL `SECURITY DEFINER` functions (`handle_new_user`, `get_schema_overview`).
  - Revoked public direct execute privileges on trigger functions.
  - Added email format check constraints and btree indexes on `profiles(email)`, `profiles(created_at)`, and `waitlist(email)`.
- **Documentation**:
  - Added `README.md` and `CHANGELOG.md`.

### Changed
- Refactored brand logos in `Navbar.jsx`, `Sidebar.jsx`, and `AuthModal.jsx` to render the clean standalone logo image without redundant adjacent text.

---

## [1.2.0] - 2026-08-27

### Added
- **Country Code Selector**:
  - Integrated international phone country code dropdown (`+91`, `+1`, `+44`, `+61`, `+49`, `+33`, `+81`, `+65`, `+971`) with flag indicators.
- **Anti-Dummy & Credibility Validation**:
  - Real-time validation rejecting repeated digits (`0000000000`, `1111111111`, `9999999999`).
  - Sequential pattern detector (`1234567890`, `9876543210`, `1122334455`).
  - Strict age validation (13 to 110 years, rejecting future dates).
  - Dummy email & placeholder name detector (`test`, `asdf`, `fake@fake.com`, `admin@admin.com`).
- **Smart Pre-filled Defaults**:
  - Default pre-filled Date of Birth (`2002-06-15`).
  - Default pre-filled country code (`+91`).

### Changed
- Converted `AuthModal.jsx` to a pure light SaaS theme matching the `#F2F3F5` / `#FFFFFF` design language.

---

## [1.1.0] - 2026-08-27

### Added
- **Supabase Schema & Data Sync Utility (`scripts/sync-schema.js`)**:
  - Registered `npm run db:sync` in `package.json`.
  - Auto-generates `SUPABASE_SCHEMA.md` with table definitions, column types, keys, RLS flags, row counts, and compact 3-row data snapshots.
- **Database Schema**:
  - Created `public.profiles` (`id`, `name`, `dob`, `email`, `phone`, `created_at`, `updated_at`) with RLS enabled.
  - Created `handle_new_user()` trigger function on `auth.users` to automatically populate `public.profiles` upon signup.
- **Authentication Service & Context**:
  - Pure business logic layer in `services/authService.js` and `services/profileService.js`.
  - Global `AuthContext.jsx` and `useAuth` hook.
  - Email verification link detection and redirect handler (`#auth?verified=true`).
- **Modal Component (`AuthModal.jsx`)**:
  - Sign in and Sign up tabs collecting Full Name, Date of Birth, Email ID, Phone Number, and Password.

---

## [1.0.0] - 2026-08-27

### Initial Checkpoint
- Restored baseline project structure from `backup.zip`.
- Cleaned unused database tables from previous explorations, retaining `public.waitlist`.
- Verified Vite React setup with TailwindCSS and GSAP animations.
