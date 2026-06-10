# Insurance Buddy

A full-stack app for understanding and tracking your employer benefits (health insurance, wellness, and learning & development).

## Tech Stack

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: Express + TypeScript
- **Database / Auth / Storage**: Supabase
- **AI Analysis**: Anthropic claude-sonnet-4-6 (document extraction)
- **Hosting**: Render

---

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. In the SQL Editor, run `supabase/migrations/001_initial.sql`
3. In **Storage**, create a new bucket named `documents` (set to **Private**)
4. In Storage → Policies, add these policies for the `documents` bucket:
   - **INSERT**: `auth.uid()::text = (storage.foldername(name))[1]`
   - **SELECT**: `auth.uid()::text = (storage.foldername(name))[1]`
   - **DELETE**: `auth.uid()::text = (storage.foldername(name))[1]`
5. Copy your **Project URL**, **anon key**, and **service_role key** from Settings → API

### 2. Server

```bash
cd server
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
npm install
npm run dev
```

### 3. Client

```bash
cd client
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
# VITE_API_URL defaults to http://localhost:3001
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploying to Render

### Server (Web Service)
- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `node dist/index.js`
- Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `CLIENT_ORIGIN` (set to your client Render URL)

### Client (Static Site)
- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL` (set to your server Render URL)

---

## How It Works

1. **Register** with email + password
2. Go to **Profile** and upload PDF/image benefit documents (one each for Insurance, Wellness, L&D)
3. Each upload automatically calls the Anthropic API to extract benefit categories and dollar limits
4. The **Dashboard** shows all your benefits as cards with remaining balances and progress bars
5. In **Expenses**, log spending against any category — the dashboard updates in real time
