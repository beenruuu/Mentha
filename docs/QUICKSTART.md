# 🚀 Quick Start Guide

> **Goal: Get running in 5 minutes**

## Prerequisites

- Python 3.10+
- Node.js 18+ & pnpm 9+
- A Supabase account (free tier works)
- At least one AI API key (OpenAI, Anthropic, etc.)

## Step 1: Clone & Setup (2 min)

```bash
git clone https://github.com/beenruuu/Mentha.git
cd Mentha

# Interactive setup wizard
python setup.py
```

The wizard will ask for:
- Supabase credentials (URL + keys)
- AI provider API keys
- Optional: Stripe, Qdrant

## Step 2: Install Dependencies (2 min)

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
cd ..

# Frontend
cd frontend
pnpm install
cd ..
```

## Step 3: Database Setup (1 min)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Open SQL Editor
3. Paste contents of `supabase/schema.sql`
4. Click "Run"

## Step 4: Start! 🎉

```bash
python start.py
```

Access:
- **App**: http://localhost:3000
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Understanding the Codebase

### Where to find things

| What you need | Where to look |
|---------------|---------------|
| Add a new page | `frontend/app/` |
| Add a component | `frontend/components/` |
| Add an API endpoint | `backend/app/api/endpoints/` |
| Modify AI analysis | `backend/app/services/` |
| Database schema | `supabase/schema.sql` |
| Environment config | `.env.example`, `backend/app/core/config.py` |

### Key Files

```
📁 Start here:
├── docs/ARCHITECTURE.md    # Full architecture overview
├── README.md               # Project overview
├── setup.py                # Setup wizard
└── start.py                # Start everything

📁 Frontend entry points:
├── frontend/app/page.tsx           # Landing page
├── frontend/app/dashboard/page.tsx # Main dashboard
└── frontend/lib/api-client.ts      # API calls

📁 Backend entry points:
├── backend/app/main.py             # FastAPI app
├── backend/app/api/router.py       # All routes
└── backend/app/core/config.py      # Configuration
```

### Common Tasks

#### Add a new frontend page
```bash
# Create new route
mkdir -p frontend/app/my-page
touch frontend/app/my-page/page.tsx
```

#### Add a new API endpoint
```bash
# 1. Create endpoint in backend/app/api/endpoints/my_endpoint.py
# 2. Register in backend/app/api/router.py
```

#### Run database migrations
```bash
# In Supabase SQL Editor, run files from:
supabase/migrations/
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `python start.py` | Start frontend + backend |
| `make dev` | Start with Docker |
| `make help` | Show all available commands |
| `cd frontend && pnpm dev` | Frontend only |
| `cd backend && uvicorn app.main:app --reload` | Backend only |

---

## Need Help?

1. Check `docs/ARCHITECTURE.md` for detailed architecture
2. Check `README.md` for feature overview
3. API docs at http://localhost:8000/docs when running
