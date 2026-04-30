# ConDyn Admin — Connection Dynamics Admin Interface

**Clean. Blue. Professional. No dark mode bullshit.**

Admin frontend for the Connection Dynamics Analyzer. Manage system prompts, test analyses, keep it clinical.

---

## STACK

- **Next.js 16** (App Router, React Server Components)
- **React** (Client Components where needed)
- **Inline Styles** (no Tailwind, no CSS modules, full control)
- **PM2** (process management, auto-restart)
- **Nginx** (reverse proxy, SSL termination)
- **Let's Encrypt** (SSL certs, auto-renew)

---

## STRUCTURE

```
/opt/condyn-admin/
├── app/
│   ├── components/
│   │   ├── ConDynPanel.tsx      # Router, Login, Header, Tabs
│   │   ├── PromptsPanel.tsx     # CRUD for System Prompts
│   │   └── AnalyzePanel.tsx     # Test Interface
│   ├── layout.tsx               # Root Layout
│   └── page.tsx                 # Entry Point
├── public/
│   └── logo.jpeg                # ConDyn Logo
├── .env.local                   # API URL Config
└── package.json
```

---

## SETUP

### Prerequisites

- Node.js 24+
- PM2 installed globally
- Backend running on `localhost:8002`
- Nginx configured

### Installation

```bash
mkdir -p /opt/condyn-admin
cd /opt/condyn-admin

# Create Next.js app
npx create-next-app@latest . --typescript --no-tailwind --eslint --app --no-src-dir --import-alias "@/*"

# Install dependencies
npm install

# Configure API URL
echo 'NEXT_PUBLIC_CONDYN_API_URL=/api' > .env.local

# Copy logo
cp /path/to/logo.jpeg public/logo.jpeg

# Build
npm run build

# Start with PM2
pm2 start npm --name condyn-admin -- start -- -p 3003
pm2 save
```

### Nginx Config

```nginx
# /etc/nginx/sites-available/admin.condyn.eu
server {
    listen 80;
    server_name admin.condyn.eu;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.condyn.eu;

    ssl_certificate /etc/letsencrypt/live/admin.condyn.eu/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.condyn.eu/privkey.pem;

    # API Proxy → Backend
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8002;
        proxy_set_header Host $host;
        proxy_set_header Authorization $http_authorization;
    }

    # Frontend → Next.js
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

Enable and reload:

```bash
ln -sf /etc/nginx/sites-available/admin.condyn.eu /etc/nginx/sites-enabled/
certbot certonly --nginx -d admin.condyn.eu
nginx -t && systemctl reload nginx
```

---

## DESIGN SYSTEM

**Color Palette:**
- Primary: `#1565C0` (kräftiges Blau)
- Accent: `#42A5F5` (hellblau)
- Background: `#F8FAFF` (fast weiß, leicht blau)
- Text: `#1A1A2E` (fast schwarz)
- Border: `rgba(21, 101, 192, 0.15)`
- Card BG: `#FFFFFF`
- Shadow: `0 2px 12px rgba(21, 101, 192, 0.08)`

**Typography:**
- System: `system-ui, -apple-system, sans-serif`
- Code: `monospace`

**Spacing:**
- Border Radius: Cards `8px`, Buttons/Inputs `6px`
- Padding: Generous, luftig
- Transitions: `all 0.15s ease`

**Principle:**
Komplett weiß. Hell. Clean. Kein dark mode. Kein cyan. Kein SYNTX-Style.
Das soll sich anders anfühlen — professionell, klinisch, präzise.

---

## API INTEGRATION

**Base URL:** `/api` (proxied via Nginx to `localhost:8002`)

### Authentication

**Login:**
```bash
POST /api/login
Body: {"username": "...", "password": "..."}
Response: {"access_token": "...", "token_type": "bearer", "expires_in": 86400}
```

Token stored in React state (NOT localStorage, NOT cookies).

**Verify:**
```bash
GET /api/verify
Header: Authorization: Bearer TOKEN
Response: {"username": "admin", "authenticated": true}
```

### Prompts

```bash
GET    /api/prompts                      # List all prompts
GET    /api/prompts/{prompt_id}          # Get prompt with content
POST   /api/prompts                      # Create: {filename, content}
PUT    /api/prompts/{prompt_id}          # Update: {content}
DELETE /api/prompts/{prompt_id}          # Delete (not if active)
POST   /api/prompts/{prompt_id}/activate # Activate (deactivates others)
GET    /api/prompts/active/current       # Get active prompt
```

**Prompt Object:**
```json
{
  "id": "cd-system-prompt-v0.4",
  "filename": "cd-system-prompt-v0.4.md",
  "version": "v0.4",
  "size": 18419,
  "modified": "2026-04-29T19:17:46.675362",
  "active": true,
  "content": "# Connection Dynamics..."
}
```

### Analyze

```bash
POST /api/analyze
Header: Authorization: Bearer TOKEN
Body: {"text": "...", "context": "optional"}
Response: {"analysis": "markdown text...", "tokens_used": 1234, "model": "claude-sonnet-4-20250514"}
```

---

## FEATURES

### Login Screen
- Animated neural network background (blue/white, subtle)
- White card, centered
- ConDyn logo
- Username + Password fields
- Blue "ANALYZE" button
- Error display

### Prompts Tab
**Left Panel (350px):**
- List of all prompts
- Active prompt: blue background, "● ACTIVE" badge
- Hover effects
- "+ NEW PROMPT" button

**Right Panel:**
- Filename as title
- "● ACTIVE" or "● UNSAVED" badges
- Full-height textarea (monospace)
- Button bar:
  - ✓ SAVE (disabled if no changes)
  - ⚡ ACTIVATE (disabled if already active)
  - 🗑 DELETE (disabled if active)
- New mode: filename input + content textarea + ✓ CREATE

### Analyze Tab
**Left Panel (45%):**
- Large textarea for input text
- Optional context input
- ⚡ ANALYZE button
- Shows active prompt
- Shows tokens used after analysis

**Right Panel (55%):**
- Markdown-rendered result
- Loading spinner during analysis
- COPY button
- "ANALYSIS RESULT" header

---

## DEVELOPMENT

### Local Dev

```bash
cd /opt/condyn-admin
npm run dev
# Open http://localhost:3000
```

### Build

```bash
npm run build
```

### Deploy

```bash
npm run build
pm2 restart condyn-admin
```

### Clean Build

```bash
rm -rf .next node_modules package-lock.json
npm install
npm run build
pm2 restart condyn-admin
```

### Logs

```bash
pm2 logs condyn-admin           # Live logs
pm2 logs condyn-admin --lines 50 # Last 50 lines
pm2 logs condyn-admin --err      # Errors only
```

### PM2 Management

```bash
pm2 list                  # Status
pm2 restart condyn-admin  # Restart
pm2 stop condyn-admin     # Stop
pm2 delete condyn-admin   # Remove
pm2 save                  # Save current state
```

---

## TROUBLESHOOTING

### "This page couldn't load"

**Browser cache issue.**

**Fix:**
1. Hard refresh: `Ctrl + Shift + R`
2. Clear browser cache completely
3. Try incognito/private window
4. Check PM2 logs: `pm2 logs condyn-admin`

### Login fails / "Invalid credentials"

**Check backend:**
```bash
curl http://localhost:8002/health
# Should return: {"status":"healthy","version":"1.0.0"}

curl -X POST http://localhost:8002/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USER","password":"YOUR_PASS"}'
# Should return token
```

**Check Nginx proxy:**
```bash
curl -X POST https://admin.condyn.eu/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USER","password":"YOUR_PASS"}'
# Should return token
```

### Prompts don't load

**API response format:**
Backend returns `{prompts: [...], count: N}`.
Frontend handles both `{prompts: [...]}` and direct `[...]` arrays.

**Debug:**
```bash
TOKEN=$(curl -s -X POST https://admin.condyn.eu/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"USER","password":"PASS"}' | jq -r .access_token)

curl -s https://admin.condyn.eu/api/prompts \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### SSL Certificate Issues

**Renew cert:**
```bash
certbot renew
systemctl reload nginx
```

**Check cert expiry:**
```bash
certbot certificates
```

---

## DEPLOYMENT CHECKLIST

- [ ] Backend running on port 8002
- [ ] DNS A record: `admin.condyn.eu` → `49.13.3.21`
- [ ] SSL cert obtained via certbot
- [ ] Nginx config in place and enabled
- [ ] `.env.local` with `NEXT_PUBLIC_CONDYN_API_URL=/api`
- [ ] Logo at `public/logo.jpeg`
- [ ] Built: `npm run build`
- [ ] PM2 running: `pm2 list`
- [ ] PM2 saved: `pm2 save`
- [ ] Test: https://admin.condyn.eu loads
- [ ] Test: Login works
- [ ] Test: Prompts CRUD works
- [ ] Test: Analyze works

---

## ARCHITECTURE NOTES

**Why Inline Styles?**
Full control. No build-time CSS processing. No class name conflicts. Styles live with components. Fast.

**Why No Tailwind?**
Design is custom. Not utility-first. Specific color palette. Specific spacing. Inline styles more direct.

**Why Client Components?**
Auth state (token) in React state. Login form needs interactivity. Prompts CRUD needs state management. Analyze needs API calls with auth headers.

**Why `/api` Proxy?**
Browser can't call `localhost:8002` from `admin.condyn.eu`. CORS nightmare. Nginx proxy solves it. Clean separation.

**Why PM2?**
Auto-restart on crash. Log management. Process monitoring. Startup on boot. Battle-tested.

---

## WHAT'S NEXT

- [ ] Add markdown rendering for analysis output
- [ ] Prompt versioning/history
- [ ] Batch analyze multiple texts
- [ ] Export analysis results
- [ ] User management
- [ ] API rate limiting display
- [ ] Dark mode (just kidding, never)

---

## LICENSE

Proprietary. ConDyn internal use only.

---

## CONTACT

Questions? Issues? Ideas?

**Repo:** Internal GitLab (TBD)  
**Docs:** This README  
**Stack:** Next.js 16 + React + Nginx + PM2  

Charlottenburg Kiez. Berlin. 2026. Built with terminal and Claude.


---

## CHANGELOG

### v1.1.0 (2026-04-30)

**Features:**
- ✓ Success toast notifications (create, activate, delete, save)
- ✓ Copy button feedback ("✓ COPIED" for 2 seconds)
- ✓ Improved NEW PROMPT mode with proper conditional rendering
- ✓ Fixed CREATE endpoint (query params instead of JSON body)
- ✓ Better empty state handling

**UI Improvements:**
- Green toast messages slide in from right, auto-dismiss after 3s
- Copy button turns green with checkmark on success
- Cleaner state management for NEW/EDIT/EMPTY modes

**Bug Fixes:**
- Backend compatibility: CREATE uses query parameters
- Proper error handling with user-friendly alerts
- Response format handling for `{prompts: [...]}` structure

---

## PRODUCTION DEPLOYMENT

**Live:** https://admin.condyn.eu

**Status:**
- ✓ SSL Certificate: Let's Encrypt (auto-renew)
- ✓ Process Management: PM2
- ✓ Reverse Proxy: Nginx
- ✓ Backend: http://localhost:8002
- ✓ Frontend: http://localhost:3003

**Last Deploy:** 2026-04-30 19:50 UTC  
**Uptime Target:** 99.9%  
**Response Time:** <200ms average

