# Project Context

## One-line idea

A node-based AI chat canvas where users can create free-form chat nodes, connect them as sequences, branches, or trees, and use configured AI providers while managing memory at tree, global, and node levels.

## Core Problem

Normal ChatGPT/Gemini chats are linear and monolithic. Long conversations lose context, branching is awkward, and users cannot freely organize prompts spatially.

This app gives users a canvas where each chat is a node. Nodes can be connected, isolated, grouped into trees, or placed anywhere.

## Product Goals

1. Free-form canvas for AI chat nodes.
2. Support sequential chats, branched chats, tree structures, and isolated nodes.
3. Users can configure multiple AI providers and API keys.
4. Memory can be scoped:
   - Global memory
   - Canvas/tree memory
   - Node-local memory
5. Isolated nodes can read memory but should not contribute to memory by default.
6. Frontend-only deployable as a static React app.
7. Use Supabase for auth and PostgreSQL persistence.
8. Keep implementation simple and maintainable.

## Non-goals for now

- No custom backend server.
- No server-side AI proxy.
- No complex agent framework.
- No multi-user real-time collaboration in MVP.
- No billing system.
- No advanced vector memory in first version unless needed later.

## Target Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow for node canvas
- Zustand or TanStack Query for state/data
- Supabase Auth
- Supabase PostgreSQL
- Supabase JS client
- Static hosting: GitHub Pages, Netlify, Vercel, Render Static, Railway static

## Main User Flow

### 1. Auth

User signs up or logs in using Supabase Auth.

Possible methods:

- Email/password
- Magic link
- Google/GitHub OAuth optional

After auth, user enters the app dashboard.

### 2. Provider Configuration

User opens Settings → Providers.

User can add provider configs such as:

- OpenRouter
- OpenAI / ChatGPT-compatible
- Gemini
- Grok / xAI
- NVIDIA NIMs
- Groq
- Any OpenAI-compatible endpoint

Each provider config contains:

- Provider name
- Provider type
- API key
- Base URL if custom
- Default model
- Enabled/disabled flag
- Optional label

Example labels:

- “My OpenRouter Key”
- “Work Gemini Key”
- “Local NVIDIA NIM”

### 3. Canvas

User opens a canvas.

Canvas contains:

- Chat nodes
- Optional note nodes
- Optional memory indicator nodes
- Edges connecting nodes

User can:

- Add a node anywhere.
- Drag nodes freely.
- Connect nodes.
- Branch one node into multiple children.
- Create multiple disconnected trees.
- Create isolated nodes.
- Run a node independently.
- Run a sequence from parent to child.
- Select provider/model per node.
- Edit system prompt per node.
- Save canvas automatically.

### 4. Chat Node

Each chat node can contain:

- Node title
- System prompt
- User prompt/message history
- Selected provider config
- Selected model
- Temperature or generation settings
- Output/response
- Memory contribution toggle
- Memory read scope

A node can be:

- Independent
- Part of a sequence
- Part of a tree
- A branch child
- A memory reader only
- A memory contributor

## Memory Model

Memory is the key differentiator.

### Memory Scopes

#### Global Memory

Available across all canvases for the user.

Use cases:

- User preferences
- Long-term facts
- Writing style
- Common instructions

#### Canvas / Tree Memory

Memory belonging to a canvas or specific connected tree.

Use cases:

- Project context
- Story context
- Codebase context
- Research context

#### Node Memory

Memory local to one node.

Use cases:

- Temporary scratch context
- Node-specific instruction
- Local summary

### Memory Rules

1. Nodes inside a connected tree can contribute to tree memory.
2. Isolated nodes can read tree/global memory but do not contribute by default.
3. A node can be explicitly marked as read-only for memory.
4. A node can be explicitly allowed to contribute if user wants.
5. Memory entries can be pinned, edited, or deleted.
6. Memory should be inspectable from a Memory Panel.

### Memory Contribution Logic

If a node is connected and `contributesToMemory = true`:

- After response generation, optionally extract a short memory summary.
- Save summary to tree memory or global memory depending on node setting.

If a node is isolated:

- It can read memory.
- It does not write memory.
- It behaves like a scratchpad using existing context.

### Context Assembly

Before calling an AI provider, build prompt context from:

1. Node system prompt.
2. Selected memory scope.
3. Parent node output if connected sequentially.
4. Immediate ancestor summary if needed.
5. Node-local memory.
6. Current node conversation history.

MVP should keep context assembly simple:

- Use parent output.
- Use recent memory entries.
- Use pinned memory entries.
- Avoid unlimited history.

## Provider System

### Provider Adapter Concept

Each provider should implement a common interface conceptually:

- List models if possible.
- Send chat completion request.
- Support streaming if possible.
- Handle errors.
- Normalize response.

### Provider Notes

#### OpenRouter

Best first provider because it supports many models and usually has browser-friendly API patterns.

#### OpenAI

Can work from browser but API key exposure and CORS must be considered.

#### Gemini

Good candidate, but API shape differs from OpenAI.

#### Grok / xAI

May use OpenAI-compatible endpoint.

#### NVIDIA NIMs

May require custom base URL and possibly CORS configuration.

#### Groq

Can be supported if OpenAI-compatible.

## Security Constraints

This is a frontend-only app, so secrets cannot be fully protected.

### API Key Handling

Default approach:

- Store provider API keys in browser storage.
- Keep keys user-scoped.
- Do not commit keys.
- Do not expose keys in public code.

Optional advanced approach:

- Store encrypted provider keys in Supabase.
- Encrypt using WebCrypto and a user passphrase.
- Decrypt only in browser session.

MVP recommendation:

- Store provider keys locally in browser.
- Store non-sensitive provider metadata in Supabase if sync is needed.

### Supabase Security

- Use anon key only.
- Never use service role key in frontend.
- Enable Row Level Security on all tables.
- Users can only access their own rows.

### CORS Limitation

Some AI providers may not allow direct browser calls.

If provider blocks CORS:

- Mark provider as unsupported in browser mode.
- Show clear error.
- Later support optional local proxy or serverless function.

## Data Model

### profiles

Stores app user profile.

Fields:

- id
- email
- display_name
- created_at
- updated_at

### provider_configs

Stores provider configuration metadata.

Fields:

- id
- user_id
- provider_type
- label
- base_url
- default_model
- api_key_reference
- enabled
- created_at
- updated_at

For MVP, actual API key may remain in local browser storage.

### canvases

Stores canvas/project.

Fields:

- id
- user_id
- title
- description
- memory_scope_setting
- created_at
- updated_at

### canvas_nodes

Stores nodes.

Fields:

- id
- canvas_id
- user_id
- node_type
- title
- position_x
- position_y
- provider_config_id
- model
- system_prompt
- prompt_content
- response_content
- memory_read_scope
- contributes_to_memory
- status
- created_at
- updated_at

Node types:

- chat
- note
- memory_viewer optional

### canvas_edges

Stores connections between nodes.

Fields:

- id
- canvas_id
- user_id
- source_node_id
- target_node_id
- edge_type
- created_at

Edge types:

- sequence
- branch
- context

### node_messages

Stores conversation messages inside a node.

Fields:

- id
- node_id
- canvas_id
- user_id
- role
- content
- token_count_estimate
- created_at

Roles:

- system
- user
- assistant
- error

### memory_items

Stores memory entries.

Fields:

- id
- user_id
- canvas_id
- source_node_id
- scope
- title
- content
- tags
- pinned
- active
- created_at
- updated_at

Scope values:

- global
- canvas
- node

## Canvas Behavior

### Node Execution

When user runs a node:

1. Read selected provider config.
2. Build context.
3. Call provider.
4. Show streaming response if supported.
5. Save response.
6. Optionally extract memory.

### Tree Execution

For connected trees:

- Parent output can feed child input.
- Branch children can receive same parent context.
- Each child can diverge with its own prompt.
- Tree memory can be updated from contributing nodes.

### Isolated Node Behavior

If node has no parent:

- It can still read global/canvas memory.
- It does not write tree memory by default.
- It can act as a scratchpad.

## Pages

### Auth Page

- Login
- Signup
- Forgot password
- OAuth optional

### Dashboard

- List canvases
- Create canvas
- Delete canvas
- Rename canvas
- Open canvas

### Settings Page

Tabs:

- Profile
- Providers
- Memory defaults
- Appearance optional

### Canvas Page

Main editor containing:

- React Flow canvas
- Node inspector panel
- Memory panel
- Provider selector
- Save/sync status

## MVP Scope

### Phase 1: App Shell

- React + Vite setup
- Tailwind + shadcn/ui
- Routing
- Supabase client setup
- Auth pages

### Phase 2: Provider Settings

- Add provider config
- Store provider metadata
- Store API key locally
- Test provider connection
- Select default provider

### Phase 3: Canvas Basics

- Create canvas
- Add node
- Drag node
- Delete node
- Connect nodes
- Save node positions
- Save node content

### Phase 4: Chat Execution

- Select provider/model per node
- Send prompt
- Receive response
- Show loading/error
- Save message history

### Phase 5: Memory MVP

- Create memory entries manually
- Auto-create simple memory after response
- Read memory into node context
- Toggle contribution per node
- Memory panel

### Phase 6: Static Hosting

- Build for production
- Deploy to GitHub Pages or Netlify
- Configure env vars
- Configure SPA routing fallback

## Recommended MVP Simplifications

To keep code simple:

1. Start with OpenRouter only.
2. Store API keys in browser storage.
3. Use one canvas per project.
4. Use simple recency-based memory retrieval.
5. Skip embeddings initially.
6. Skip vector search initially.
7. Skip multi-user sharing initially.
8. Use React Flow for all node interactions.
9. Avoid complex backend functions.
10. Keep provider adapters minimal.

## Future Enhancements

- Embeddings and semantic memory search.
- pgvector in Supabase.
- Memory graph visualization.
- Automatic memory summarization.
- Node templates.
- Prompt templates.
- Export/import canvas JSON.
- Multi-canvas memory sharing.
- Provider health checks.
- Token usage tracking.
- Cost estimation.
- Local model provider support.
- Optional lightweight proxy for CORS-blocked providers.

## Major Risks

### 1. API Key Exposure

Since frontend-only, API keys can be seen in browser. Acceptable for personal tool, risky for public multi-user app.

### 2. CORS Issues

Some providers may not support direct browser calls.

### 3. Memory Growth

Memory can become noisy. Need pruning, pinning, and summarization.

### 4. Graph Complexity

Cycles and deeply nested trees can make context assembly confusing.

### 5. Static Hosting Limitations

No backend means no secret storage, no server-side cron, no secure proxy.

## Deployment Plan

### Local Development

- Vite dev server
- Supabase hosted project
- Environment variables:
  - Supabase URL
  - Supabase anon key

### Production Static Build

- Build React app
- Deploy static output
- Set environment variables in hosting provider
- Configure SPA fallback for client routing

### Hosting Options

#### GitHub Pages

Good for static hosting.

Needs:

- Base path configuration
- SPA fallback workaround if using client routing

#### Netlify

Easier SPA routing.

#### Vercel

Also easy SPA routing.

#### Render / Railway

Can host static build if static option is used.

## Definition of Done for MVP

The app is successful if:

1. User can log in.
2. User can add an AI provider API key.
3. User can create a canvas.
4. User can add chat nodes anywhere.
5. User can connect nodes.
6. User can run a node using selected provider.
7. User can branch conversations.
8. Isolated nodes can read memory without contributing.
9. Tree nodes can contribute to tree memory.
10. App is deployable as a static frontend.