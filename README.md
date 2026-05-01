# ConDyn Admin 🧠⚡

**Connection Dynamics Structural Analyzer — Admin Interface**

> *Mate, you know how most admin panels are like... beige? Corporate? Soul-crushing?  
> Yeah nah. Not this one. This is for real work.*

```
   ╔═══════════════════════════════════════════════════════╗
   ║                                                       ║
   ║    ConDyn Admin — Where Prompts Go To Get Real       ║
   ║                                                       ║
   ║    [PROMPTS] ←→ [ANALYZE] ←→ [FRAMEWORK RESEARCH]   ║
   ║                                                       ║
   ╚═══════════════════════════════════════════════════════╝
```

---

## 🎯 What This Actually Is

You're building a **structural diagnostic tool** for organizational behavior. Connection Dynamics Framework. Four Laws. Trust-debt. Cascades. Discharge. The whole philosophical apparatus.

But frameworks are theory. **This tool is research infrastructure.**

ConDyn Admin is where you:
- **Test prompts** against real documents (the messy ones)
- **Iterate the framework** (v0.2 → v0.3 → v0.4 → ...)
- **Find edge cases** (where the theory breaks)
- **Build evidence** (before you write the graph engine)

**Live:** https://admin.condyn.eu  
**Stack:** Next.js 16, React, Inline Styles, Zero Dependencies  
**Backend:** ConDyn Analyzer API (FastAPI, SQLite, Multi-User)

---

## 🏗️ The Architecture (How This Thing Works)

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16 — This Repo)                      │
│  ├─ Login (.env auth, no backend call)                  │
│  ├─ PROMPTS Tab (CRUD for system prompts)               │
│  ├─ ANALYZE Tab (test framework on documents)           │
│  └─ Neural Canvas Animation (because why not)           │
└─────────────────────────────────────────────────────────┘
                         ↓ HTTPS ↓
┌─────────────────────────────────────────────────────────┐
│  NGINX (Reverse Proxy)                                   │
│  ├─ /api/* → Backend (localhost:8002)                   │
│  ├─ /* → Frontend (localhost:3003)                      │
│  └─ SSL: Let's Encrypt                                  │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  BACKEND (FastAPI — /opt/condyn-analyzer)               │
│  ├─ Multi-User Auth (JWT)                               │
│  ├─ Prompts (SQLite DB, per-user ownership)             │
│  ├─ /analyze → Claude API (uses active prompt)          │
│  └─ Analysis History (saved to DB)                      │
└─────────────────────────────────────────────────────────┘
```

**Key Insight:** Backend v2.0 went multi-user (users own prompts). Admin sees all prompts, activates one globally. That's the current gap — backend thinks per-user, frontend thinks system-wide. Works for now. Backend changes coming later.

---

## 🚀 Quick Start (Getting This Running)

### Prerequisites

```bash
# You need:
- Ubuntu 24.04 (or similar)
- Node.js 18+ and npm
- Backend already running at localhost:8002
- Domain pointing to your server (admin.condyn.eu)
- SSL cert (Let's Encrypt via certbot)
```

### 1. Clone & Install

```bash
cd /opt
git clone git@github.com:SYNTX-SYSTEM/condyn-admin.git
cd condyn-admin
npm install
```

### 2. Environment Setup

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_CONDYN_API_URL=/api
NEXT_PUBLIC_ADMIN_USERNAME=condyn
NEXT_PUBLIC_ADMIN_PASSWORD="YourSecurePassword123"
NEXT_PUBLIC_BACKEND_TOKEN=your-jwt-token-here
EOF
```

**Important:** Password in QUOTES if it contains `#` or special chars!

**Get Backend Token:**

```bash
# Register admin user in backend
curl -X POST https://admin.condyn.eu/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"condyn","email":"admin@condyn.eu","password":"YourPassword"}'

# Login and get token
curl -X POST https://admin.condyn.eu/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"condyn","password":"YourPassword"}' | jq -r '.access_token'

# Put that token in .env.local as NEXT_PUBLIC_BACKEND_TOKEN
```

### 3. Build & Start

```bash
npm run build
pm2 start npm --name condyn-admin -- start -- -p 3003
pm2 save
```

### 4. Nginx Config

```nginx
# /etc/nginx/sites-available/admin.condyn.eu
server {
    listen 443 ssl;
    server_name admin.condyn.eu;
    
    ssl_certificate /etc/letsencrypt/live/admin.condyn.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.condyn.eu/privkey.pem;
    
    # Backend API
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/admin.condyn.eu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Import Prompts (ONE TIME ONLY)

```bash
cd /opt/condyn-analyzer
TOKEN=$(grep BACKEND_TOKEN /opt/condyn-admin/.env.local | cut -d'=' -f2 | tr -d '"')

# Import each .md file
for file in prompts/*.md; do
  filename=$(basename "$file")
  content=$(cat "$file")
  
  curl -X POST https://admin.condyn.eu/api/prompts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"filename\":\"$filename\",\"content\":$(echo "$content" | jq -Rs .),\"version\":\"v1.0\"}"
done
```

**Done!** Open https://admin.condyn.eu → Login → See your prompts!

---

## 🎨 Design System (Clean, White, Professional)

```
COLOR PALETTE:
├─ Primary Blue:  #1565C0 (buttons, headers, active states)
├─ Accent Blue:   #42A5F5 (activate button, highlights)
├─ Background:    #F8FAFF (page background, subtle off-white)
├─ Text Dark:     #1A1A2E (headings, primary text)
├─ Text Medium:   #666    (secondary text, metadata)
└─ Success Green: #4CAF50 (toast notifications)

TYPOGRAPHY:
├─ UI Text:       system-ui, -apple-system, sans-serif
├─ Code/IDs:      ui-monospace, monospace
└─ Spacing:       8px base unit, generous padding

COMPONENTS:
├─ Cards:         8px border-radius, soft shadows
├─ Buttons:       6px border-radius, 0.15s transitions
├─ Inputs:        Focus state = #1565C0 border
└─ Toasts:        Slide-in from right, 3s auto-dismiss
```

**Philosophy:** NOT dark mode. NOT cyan gradients. NOT SYNTX style.  
Clean. White. Professional. Like you're building something serious.

---

## 📂 Project Structure

```
condyn-admin/
├─ app/
│  ├─ components/
│  │  ├─ ConDynPanel.tsx      # Main router (login, tabs, header)
│  │  ├─ PromptsPanel.tsx     # CRUD for prompts
│  │  └─ AnalyzePanel.tsx     # Test framework on documents
│  ├─ layout.tsx              # Root layout
│  └─ page.tsx                # Entry point ('use client')
├─ public/
│  └─ logo.jpeg               # ConDyn logo (blue circle, neon glow)
├─ .env.local                 # Credentials (NOT in git!)
├─ package.json               # Dependencies
└─ README.md                  # This file
```

**Key Files:**

- **ConDynPanel.tsx** (294 lines) — Auth, tabs, header, logout
- **PromptsPanel.tsx** (491 lines) — List, create, edit, delete, activate
- **AnalyzePanel.tsx** (~200 lines) — Input, analyze, result display

---

## 🔐 Authentication Flow

```
Frontend Auth (Simple):
┌──────────────────────────────────────┐
│ User enters:                          │
│  - Username (from .env)               │
│  - Password (from .env)               │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ Check: username === ADMIN_USER &&     │
│        password === ADMIN_PASS        │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│ ✓ Login Success                       │
│ → React state: authenticated=true     │
│ → Show PROMPTS/ANALYZE tabs           │
└──────────────────────────────────────┘

Backend Auth (For API Calls):
┌──────────────────────────────────────┐
│ Every API call includes:              │
│ Authorization: Bearer BACKEND_TOKEN   │
│ (from .env.local)                     │
└──────────────────────────────────────┘
```

**Why This Way?**

Admin is for YOUR team. Not public. Simple .env auth = fast iteration.  
Backend has proper multi-user JWT for the user-facing frontend (later).

---

## 🛠️ Components Deep Dive

### ConDynPanel.tsx — The Router

**What It Does:**

1. **Login Screen**
   - White card on #F8FAFF background
   - Neural network canvas animation (blue nodes, subtle connections)
   - Username + password inputs
   - Password visibility toggle (👁️ icon)
   - Error handling (shows what doesn't match)

2. **Header** (after login)
   - Logo + "Connection Dynamics ADMIN" title
   - Tab navigation: PROMPTS | ANALYZE
   - LOGOUT button (red, dangerous vibes)

3. **Content Area**
   - Renders PromptsPanel or AnalyzePanel based on active tab

**State:**
```typescript
authenticated: boolean      // Login status
activeTab: 'prompts' | 'analyze'
username, password: string
showPassword: boolean       // Eye toggle
error: string              // Login errors
```

### PromptsPanel.tsx — CRUD Interface

**Layout:**

```
┌────────────────────────────────────────────────┐
│  Left Panel (350px)          Right Panel       │
│  ┌──────────────────┐       ┌────────────────┐│
│  │ + NEW PROMPT     │       │ EDIT MODE      ││
│  ├──────────────────┤       │                ││
│  │ cd-v0.4  ● ACTIVE│       │ Filename:      ││
│  │ v0.4 • 18.0KB    │       │ [input]        ││
│  ├──────────────────┤       │                ││
│  │ cd-v0.3          │       │ Content:       ││
│  │ v0.3 • 13.2KB    │       │ [textarea]     ││
│  ├──────────────────┤       │                ││
│  │ system_prompt_en │       │ ✓ SAVE         ││
│  │ v1.0 • 8.3KB     │       │ ⚡ ACTIVATE    ││
│  └──────────────────┘       │ 🗑 DELETE      ││
│                              └────────────────┘│
└────────────────────────────────────────────────┘
```

**Operations:**

- **LIST** — GET /prompts → loads all prompts (admin sees all)
- **VIEW** — Click prompt → GET /prompts/{id} → loads content
- **EDIT** — Change content → ✓ SAVE → PUT /prompts/{id}
- **CREATE** — + NEW PROMPT → enter filename/content → ✓ CREATE → POST /prompts
- **ACTIVATE** — ⚡ ACTIVATE → POST /prompts/{id}/activate
- **DELETE** — 🗑 DELETE → DELETE /prompts/{id} (disabled if active)

**Success Toasts:**

Green slide-in notifications (top right):
- "✓ filename.md created"
- "⚡ filename.md activated"
- "✓ filename.md saved"
- "🗑 Prompt deleted"

**State Management:**

```typescript
prompts: Prompt[]           // All prompts
selected: Prompt | null     // Currently editing
editContent: string         // Textarea content
editFilename: string        // Filename input
isNew: boolean             // NEW mode vs EDIT mode
hasChanges: boolean        // UNSAVED badge
loading: boolean           // Disable buttons during API calls
successMessage: string     // Toast message
```

### AnalyzePanel.tsx — Framework Testing

**Layout:**

```
┌────────────────────────────────────────────────┐
│  Using: cd-system-prompt-v0.4.md               │
├──────────────────────┬─────────────────────────┤
│  INPUT (45%)         │  RESULT (55%)           │
│  ┌────────────────┐  │ ┌─────────────────────┐ │
│  │ [textarea]     │  │ │ Markdown rendered   │ │
│  │                │  │ │                     │ │
│  │ Document text  │  │ │ ## Structural       │ │
│  │ goes here...   │  │ │ reading             │ │
│  │                │  │ │                     │ │
│  │                │  │ │ The document...     │ │
│  └────────────────┘  │ │                     │ │
│  Context (optional): │ │ Tokens: 1,234       │ │
│  [input]             │ │                     │ │
│                      │ │ [✓ COPIED] button   │ │
│  [ANALYZE]           │ └─────────────────────┘ │
└──────────────────────┴─────────────────────────┘
```

**Flow:**

1. User pastes document → enters optional context
2. Clicks ANALYZE
3. POST /analyze → backend uses active prompt
4. Result displays (markdown formatted)
5. Shows tokens used
6. COPY button → clipboard → turns green "✓ COPIED" for 2s

**Features:**

- Auto-loads active prompt on mount (displays at top)
- Markdown rendering in result panel
- Copy button with visual feedback
- Loading spinner during analysis
- Empty state: "Enter text to analyze..."

---

## 🔌 API Integration

**Base URL:** `/api` (proxied via Nginx to localhost:8002)

### Endpoints Used

```typescript
// Auth (Backend)
POST   /login          → {access_token, ...}
POST   /register       → {message, user}

// Prompts
GET    /prompts                    → {prompts: [...], count: N}
GET    /prompts/{id}               → {id, filename, content, ...}
POST   /prompts                    → Create (JSON body)
PUT    /prompts/{id}               → {content: "..."}
DELETE /prompts/{id}               → {message: "..."}
POST   /prompts/{id}/activate      → Activate globally
GET    /prompts/active/current     → {prompt: {...}}

// Analysis
POST   /analyze                    → {text, context} → {analysis, tokens_used}
```

**Headers:**

```typescript
Authorization: Bearer {BACKEND_TOKEN}   // From .env.local
Content-Type: application/json          // For POST/PUT
```

**Response Format:**

```typescript
// Prompts list
{
  prompts: [
    {
      id: 5,
      filename: "cd-system-prompt-v0.4.md",
      version: "v0.4",
      is_active: true,              // ← Note: is_active (not active!)
      created_at: "2026-05-01...",
      updated_at: "2026-05-01..."
    }
  ],
  count: 5
}

// Prompt detail
{
  id: 5,
  filename: "cd-system-prompt-v0.4.md",
  content: "# System Prompt\n\n...",  // Full markdown
  version: "v0.4",
  is_active: true
}

// Analysis result
{
  id: 42,
  analysis: "## Structural reading\n\n...",
  timestamp: "2026-05-01T03:15:00",
  prompt_used: "cd-system-prompt-v0.4.md"
}
```

---

## 🐛 Troubleshooting (Common Issues)

### 1. Login Says "Invalid credentials"

**Check:**

```bash
# What's in .env.local?
cat .env.local | grep ADMIN

# Password has # or special chars?
# → Must be in QUOTES!
NEXT_PUBLIC_ADMIN_PASSWORD="Pass#word123"  # ✓ GOOD
NEXT_PUBLIC_ADMIN_PASSWORD=Pass#word123    # ✗ BAD (cuts at #)
```

**After changing .env.local:**

```bash
npm run build        # Rebuild (env is baked into build!)
pm2 restart condyn-admin
```

### 2. Prompts List Is Empty

**Cause:** Admin user has no prompts in DB yet.

**Fix:** Run import script (see Quick Start step 5)

**Or create manually:**

```bash
TOKEN=$(grep BACKEND_TOKEN .env.local | cut -d'=' -f2 | tr -d '"')

curl -X POST https://admin.condyn.eu/api/prompts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.md","content":"Test prompt","version":"v1.0"}'
```

### 3. Active Badge Doesn't Show

**Check interface:**

```typescript
// In PromptsPanel.tsx - should be:
interface Prompt {
  is_active: boolean;    // ✓ CORRECT
}

// NOT:
interface Prompt {
  active: boolean;       // ✗ WRONG (old v1.0 format)
}
```

**Backend returns `is_active`, frontend must use `is_active`!**

### 4. CREATE Returns 422 Error

**Cause:** Backend expects JSON body, frontend sending query params.

**Check:**

```typescript
// Should be:
fetch(`${API_URL}/prompts`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    filename: editFilename,
    content: editContent,
    version: 'v1.0'
  })
})

// NOT query params:
fetch(`${API_URL}/prompts?filename=...&content=...`)  // ✗ WRONG
```

### 5. "This page couldn't load" (Browser)

**Cause:** Server Components vs Client Components mismatch.

**Fix:** Ensure `'use client';` at top of page.tsx:

```typescript
// app/page.tsx
'use client';           // ← MUST BE HERE
import ConDynPanel from './components/ConDynPanel';

export default function Home() {
  return <ConDynPanel />;
}
```

### 6. CORS / API Not Reachable

**Check Nginx:**

```bash
sudo nginx -t                    # Test config
sudo systemctl status nginx      # Is it running?
tail -f /var/log/nginx/error.log # Check errors
```

**Check Backend:**

```bash
curl http://localhost:8002/health  # Backend alive?
pm2 logs condyn-analyzer           # Backend logs
```

### 7. Changes Not Appearing

**Next.js caches EVERYTHING.**

```bash
# Nuclear option:
rm -rf .next node_modules package-lock.json
npm install
npm run build
pm2 restart condyn-admin

# Browser:
Ctrl+Shift+R (hard refresh)
```

---

## 📊 Current Status (What Works)

```
✓ Login (Username/Password from .env)
✓ Prompts List (Shows all prompts for admin)
✓ Active Badge (● ACTIVE in list)
✓ Load Prompt Content (Click to edit)
✓ Save Prompt (Updates content)
✓ Create Prompt (JSON body, with version)
✓ Delete Prompt (Disabled if active)
✓ Activate Prompt (Sets is_active=true)
✓ Active Prompt Display (ANALYZE tab shows which is active)
✓ Analyze Document (Uses active prompt)
✓ Copy Result (Clipboard with feedback)
✓ Success Toasts (Create, Activate, Save, Delete)
✓ Password Toggle (Eye icon)
✓ Neural Canvas Animation (Login screen)
✓ Responsive Layout (Works on desktop)
✓ SSL (Let's Encrypt)
✓ PM2 Process Management
✓ GitHub (v1.3.0)
```

---

## 🚧 Known Limitations / Future Work

### Backend Changes Needed (Later)

**Current:** Backend v2.0 is multi-user. Each user owns their prompts. Admin (user_id=5) sees all prompts via special handling, but activation is still per-user in DB logic.

**Future:** Backend needs:
- `is_admin` flag on User model
- Admin endpoints return ALL prompts (not just user's)
- Activate sets global active (not per-user)
- /analyze uses global active prompt (not user's active)

**For Now:** Works because admin user manually activates for each user. Good enough for research phase.

### Features Not Built Yet

- **Prompt Versioning** — No history/rollback (just overwrite)
- **Batch Analyze** — One doc at a time only
- **Export Results** — No CSV/JSON export (just copy)
- **User Management** — No user CRUD in admin
- **Mistral Integration** — Model selector (backend ready, frontend not)
- **Markdown Rendering** — Analyze result is raw markdown (no pretty render)
- **Mobile Support** — Works on desktop only

---

## 🔬 Research Workflow (How You Actually Use This)

```
PHASE 1: PROMPT ITERATION
┌────────────────────────────────────────┐
│ 1. Start with cd-system-prompt-v0.4    │
│ 2. Run 20-30 analyses on real docs     │
│ 3. Note where framework breaks         │
│ 4. Edit prompt in admin                │
│ 5. Save as v0.5                         │
│ 6. Activate v0.5                        │
│ 7. Re-run same docs                     │
│ 8. Compare outputs                      │
│ 9. Iterate until stable                 │
└────────────────────────────────────────┘
           ↓
PHASE 2: EDGE CASE COLLECTION
┌────────────────────────────────────────┐
│ 1. Find documents that break prompt    │
│ 2. Document failure modes               │
│ 3. Classify structural ambiguity        │
│ 4. Build test corpus                    │
└────────────────────────────────────────┘
           ↓
PHASE 3: GRAPH ENGINE DESIGN
┌────────────────────────────────────────┐
│ 1. Patterns from prompts → Constraints │
│ 2. Four Laws → Axiom Registry          │
│ 3. Validated edge cases → Test suite   │
│ 4. Build deterministic graph engine     │
└────────────────────────────────────────┘
```

**This Tool = Phase 1 Infrastructure**

You're not building the final system yet.  
You're validating the framework logic.  
Finding where it works. Where it doesn't.  
Collecting evidence.

**Then:** SprinD application with empirical data.  
**Then:** Deterministic graph engine (Stage 1).

---

## 📝 Changelog

### v1.3.0 (2026-05-01) — Complete CRUD + Active Display

**Features:**
- Active prompt display in ANALYZE tab
- Active badge in PROMPTS list (● ACTIVE)
- CREATE prompt works (JSON body)
- All CRUD operations functional
- 5 prompts imported for admin user

**Fixes:**
- Fixed: is_active property (was: active)
- Fixed: CREATE endpoint (JSON body vs query params)
- Fixed: Active prompt display (data.prompt?.filename)
- Fixed: TypeScript interface (Prompt.is_active)

### v1.2.1 (2026-05-01) — Active Badge Fix

**Fixes:**
- Interface Prompt: active → is_active
- All references updated throughout component
- TypeScript compilation successful

### v1.2.0 (2026-05-01) — .env Auth + Password Toggle

**Features:**
- .env-based admin authentication (no backend login call)
- Backend token from .env for API calls
- Password visibility toggle (eye icon)
- Fixed: # in password now works (quotes in .env)
- Cleaned console logs (no sensitive data)

### v1.1.0 (2026-04-30) — Success Notifications

**Features:**
- Success toast notifications (create, activate, delete, save)
- Copy button feedback ("✓ COPIED" for 2 seconds)
- Improved NEW PROMPT mode rendering

**Fixes:**
- Backend compatibility: CREATE uses query parameters
- Proper error handling with user-friendly alerts

### v1.0.0 (2026-04-30) — Initial Release

**Features:**
- Next.js 16 admin interface
- Token-based auth (React state, no localStorage)
- Prompts CRUD (Create, Read, Update, Delete, Activate)
- Analyze interface with active prompt integration
- Neural network login animation
- Clean blue/white design
- PM2 process management
- Nginx reverse proxy + SSL

---

## 🎓 Lessons Learned (Technical Wisdom)

### Next.js Quirks

**1. .env Variables Are Baked Into Build**

```bash
# Change .env.local?
# → MUST rebuild!
npm run build
pm2 restart condyn-admin
```

**2. `NEXT_PUBLIC_` Prefix Required**

```bash
# Browser can't see:
API_URL=...              # ✗ Server-side only

# Browser CAN see:
NEXT_PUBLIC_API_URL=...  # ✓ Available in browser
```

**3. Server Components vs Client Components**

```typescript
// Top-level page MUST be client component if it uses React hooks
'use client';  // ← Add this!
import { useState } from 'react';
```

### API Integration Gotchas

**1. Backend Response Format Changed**

```typescript
// v1.0 (filesystem):
{id: "cd-system-prompt-v0.4", active: true}

// v2.0 (database):
{id: 5, filename: "cd-system-prompt-v0.4.md", is_active: true}
//                                              ↑ Different property!
```

**2. Query Params vs JSON Body**

```bash
# Old backend (v1.0):
POST /prompts?filename=test.md&content=...

# New backend (v2.0):
POST /prompts
Content-Type: application/json
{"filename":"test.md","content":"..."}
```

**Frontend must match backend expectations!**

### Special Characters in .env

```bash
# Password: Pass#word123

# WRONG:
NEXT_PUBLIC_ADMIN_PASSWORD=Pass#word123
# → Reads as: "Pass" (# starts comment!)

# CORRECT:
NEXT_PUBLIC_ADMIN_PASSWORD="Pass#word123"
# → Reads full password including #
```

### PM2 Process Management

```bash
# Start:
pm2 start npm --name condyn-admin -- start -- -p 3003

# Restart after code change:
pm2 restart condyn-admin

# Logs:
pm2 logs condyn-admin --lines 50

# Status:
pm2 status

# Save config (survive reboot):
pm2 save
pm2 startup
```

---

## 🌐 Deployment Checklist

**Pre-Deploy:**

- [ ] .env.local configured (all 4 variables)
- [ ] Backend running (localhost:8002)
- [ ] Domain DNS pointing to server
- [ ] SSL cert obtained (certbot)
- [ ] Nginx configured

**Deploy:**

- [ ] `npm install`
- [ ] `npm run build`
- [ ] PM2 start
- [ ] PM2 save
- [ ] Nginx reload
- [ ] Test login
- [ ] Import prompts (if first time)
- [ ] Test CRUD operations
- [ ] Test analyze

**Post-Deploy:**

- [ ] Check PM2 logs (no errors)
- [ ] Check Nginx logs (no 502/503)
- [ ] Browser hard refresh (Ctrl+Shift+R)
- [ ] Test on Firefox (different engine)

---

## 🤝 Contributing (If You're On The Team)

```bash
# 1. Clone
git clone git@github.com:SYNTX-SYSTEM/condyn-admin.git
cd condyn-admin

# 2. Branch
git checkout -b feature/your-feature

# 3. Make changes
# 4. Test locally
npm run dev  # localhost:3000

# 5. Commit
git add -A
git commit -m "feat: your feature description"

# 6. Push
git push origin feature/your-feature

# 7. PR on GitHub
```

**Commit Message Format:**

```
feat: add new feature
fix: bug fix
docs: documentation only
style: formatting (no code change)
refactor: code restructuring
test: adding tests
chore: build/tooling
```

---

## 📚 Tech Stack Deep Dive

### Frontend

```
Next.js 16.2.4 (App Router)
├─ React 19
├─ TypeScript
├─ NO Tailwind (inline styles only!)
├─ NO UI library
├─ NO state management (React useState only)
└─ NO external dependencies (pure React)
```

**Why No Dependencies?**

Fast. Simple. No version conflicts. No build complexity.  
Inline styles = see what you get. No mystery CSS.

### Backend (Separate Repo)

```
FastAPI (Python)
├─ SQLModel (SQLite ORM)
├─ JWT Auth (python-jose)
├─ Claude API (Anthropic SDK)
└─ Multi-user database
```

### Infrastructure

```
Server: Hetzner Ubuntu 24.04
Process: PM2 (Node.js process manager)
Proxy: Nginx (reverse proxy + SSL)
SSL: Let's Encrypt (certbot auto-renew)
Domain: admin.condyn.eu
```

---

## 🎯 The Bottom Line

**This is research infrastructure.**

Not a product. Not a SaaS. Not for end users.  
For YOU. To test the framework. Find the edges. Build evidence.

The graph engine comes later.  
The SprinD application comes later.  
The deterministic structural compute comes later.

**Right now:** You're in the prompt testing phase.  
Document → Framework → Violations → Cascade → Evidence.

**This tool makes that fast.**

One prompt. Twenty documents. Pattern emerges.  
Edit prompt. Re-run. Pattern sharpens.  
v0.4 → v0.5 → v0.6 → stable.

**Then:** Graph constraints from validated prompt logic.  
**Then:** Empirical data for SprinD pitch.  
**Then:** Stage 1 execution.

**For now:** Just run the experiments. 🧪

---

## 🍺 Final Notes (From The Trenches)

Built this in ~8 hours. Terminal only. Ping-pong with Claude.

Started with auth broken. Backend changed (v1.0 → v2.0).  
Fixed .env escaping (#). Fixed is_active vs active.  
Fixed query params vs JSON. Fixed TypeScript interfaces.

**Every bug was a decision made elsewhere.**

Backend went multi-user → Frontend stayed single-admin.  
Backend uses is_active → Frontend used active (old).  
Backend wants JSON → Frontend sent query params (old).

**Alignment is everything.**

When systems don't align, nothing works.  
When they DO align, it Just Works™.

**This aligns now.** Ship it. Test it. Break it. Learn from it.

**Then build the next thing.** 🚀

---

**Built with:** Next.js, React, TypeScript, Coffee, Frustration, Persistence  
**Deployed on:** Hetzner, Nginx, PM2, Let's Encrypt  
**Maintained by:** Denver, Ottavio, Tobias  
**License:** Internal Use Only  
**Questions?** Read the code. It's only 800 lines.

---

```
   ╔═══════════════════════════════════════════════════════╗
   ║                                                       ║
   ║    "The framework is theory.                          ║
   ║     This tool is where theory meets reality."         ║
   ║                                                       ║
   ║                               — ConDyn Team, 2026     ║
   ║                                                       ║
   ╚═══════════════════════════════════════════════════════╝
```

**Now go test some prompts.** 🧠⚡
