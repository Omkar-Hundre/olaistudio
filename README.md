# Olai — Spatial AI Workspace

<div align="center">
  <img src="public/Olai Logo.png" alt="Olai Logo" width="140" />
  <p><strong>A spatial workspace for thinking beyond the linear chat box.</strong></p>
  <p>Branch conversations, scope shared memory, and connect multiple AI models on an infinite spatial canvas.</p>
</div>

---

## 🌟 Features

- **Spatial AI Workflow**: Infinite 2D visual canvas for branching multi-model AI discussions, prompt orchestration, and spatial memory.
- **Authentication & User Management**:
  - Full Sign Up flow collecting **Full Name**, pre-filled **Date of Birth**, **Email Address**, and **Country Code + Phone Number**.
  - Strict anti-dummy & credibility validation (detects sequential phone numbers, repeated digits, disposable test emails, and unrealistic ages).
  - Secure **Supabase Email Verification** redirecting verified users seamlessly into the application.
  - **7-Day JWT Session Lifecycle**: Auto-refreshing tokens backed by custom storage enforcing a 7-day expiration TTL.
  - **Idempotency Key Utility**: Safe and deduplicated API request orchestration.
- **Production Database Architecture (Supabase / PostgreSQL)**:
  - Fully normalized `public.profiles` table with automatic triggers on `auth.users`.
  - Row Level Security (RLS) policies on all tables (`profiles`, `waitlist`).
  - Hardened database security (immutable `search_path`, revoked trigger execution from public roles, indexing on email and created timestamps).
- **Automated Database Schema Tracker (`npm run db:sync`)**:
  - Inspects active database tables, columns, data types, constraints, RLS status, row counts, and compact sample rows.
  - Auto-updates `SUPABASE_SCHEMA.md` with a clean, lightweight footprint.
- **Responsive Workspace Interface**:
  - Modern, pure light-themed interface.
  - Responsive collapsible desktop sidebar and mobile slide-over drawer.
  - Floating canvas controls dock (Zoom, Pan, Fit View, Select tool).
  - Empty workspace state with quick-starter cards.

---

## 📁 Architecture & Code Structure

The project follows a clean separation of concerns:

```
OPENCHAT/
├── public/
│   └── Olai Logo.png         # Official Olai logo branding
├── scripts/
│   └── sync-schema.js        # Supabase database schema & snapshot sync utility
├── src/
│   ├── config/
│   │   └── constants.js      # Global constants, validation rules, country codes, routes
│   ├── services/
│   │   ├── authService.js    # Pure business logic: sign up, sign in, validation, session handling
│   │   └── profileService.js # Pure business logic: user profile CRUD operations
│   ├── contexts/
│   │   └── AuthContext.jsx   # Application-wide auth state, session listener, verification callbacks
│   ├── hooks/
│   │   └── useAuth.js        # Custom React hook for consuming AuthContext
│   ├── components/
│   │   ├── auth/
│   │   │   └── AuthModal.jsx # Light-themed Sign In & Sign Up modal with phone country selector
│   │   ├── dashboard/
│   │   │   ├── Sidebar.jsx   # Compact, collapsible responsive sidebar
│   │   │   └── AppDashboard.jsx # Empty spatial canvas workspace for logged-in users
│   │   ├── HeroSection.jsx   # Landing page hero with dynamic animations
│   │   ├── Navbar.jsx        # Landing page navigation with dynamic auth actions
│   │   ├── ProblemSection.jsx
│   │   ├── HowItWorksSection.jsx
│   │   ├── ProductShowcaseSection.jsx
│   │   ├── ProvidersSection.jsx
│   │   ├── WaitlistSection.jsx
│   │   └── Footer.jsx
│   ├── lib/
│   │   └── supabase.js       # Supabase client with 7-day TTL storage & idempotency generator
│   ├── App.jsx               # Application root (routes between Landing Page and AppDashboard)
│   ├── main.jsx              # Vite React entrypoint
│   └── index.css             # TailwindCSS design tokens & typography
├── SUPABASE_SCHEMA.md        # Auto-generated database schema & sample data snapshot
├── CHANGELOG.md              # Project history & release logs
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Supabase Project (Active instance configured)

### 1. Installation
```bash
# Clone or navigate to the project directory
cd d:/OPENCHAT

# Install dependencies
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 4. Sync Database Schema
To inspect the database and refresh `SUPABASE_SCHEMA.md`:
```bash
npm run db:sync
```

### 5. Production Build
```bash
npm run build
```

---

## 🔒 Security & Best Practices

- **Row Level Security (RLS)**: Enforced on all public tables (`profiles`, `waitlist`).
- **Function Hardening**: `SECURITY DEFINER` functions run with explicit `SET search_path = public, auth, pg_temp` to prevent privilege escalation.
- **Credential Protection**: Client environment only exposes the public anon key. All sensitive database operations are guarded by RLS policies (`auth.uid() = id`).
- **Session Duration**: Custom storage wrapper enforces a 7-day maximum session duration (`SESSION_MAX_AGE_MS = 604800000`).

---

## 📄 License
Private & Proprietary. All rights reserved.
