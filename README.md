# 🌿 Mentha - Brand Presence Platform in AIs

![Mentha](frontend/public/mentha-preview.png)

**Mentha** is a SaaS platform exclusively focused on **auditing and controlling brand presence in conversational AIs** like ChatGPT, Claude, Perplexity, and Gemini.

---

## 🎯 What does Mentha do?

### AI Presence Audit
- Analyzes what AIs say about your brand
- Detects errors, omissions, and outdated information
- Monitors assigned competitors
- Automatic daily tracking

### Optimization for Citation
- Content recommendations to improve citations
- Technical AEO (AI Engine Optimization) analysis
- Structured data and optimized FAQs

### Control and Measurement
- Visibility score per AI (ChatGPT, Claude, Perplexity, Gemini)
- Direct and indirect citations
- Comparison with competitors (Share of Voice)
- Prioritized insights and recommendations

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- pnpm 9+
- Supabase Account
- AI API Keys (OpenAI, Anthropic, Google, Perplexity)

### 1. Clone the Repository
```bash
git clone https://github.com/beenruuu/Mentha.git
cd Mentha
```

### 2. Automated Setup
```bash
python setup.py
```

The script will guide you to configure:
- Supabase Variables
- AI Provider API Keys
- Daily tracking tracking configuration
- Stripe (optional for payments)

### 3. Install Dependencies

**Backend:**
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
pnpm install
```

### 4. Configure Database
1. Create a project in [Supabase](https://supabase.com)
2. Run the schema in SQL Editor: `supabase/schema.sql`
3. Run migrations from `supabase/migrations/`

### 5. Start the Application
```bash
python start.py
```

The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📁 Project Structure

```
mentha/
├── backend/                    # FastAPI API
│   ├── app/
│   │   ├── api/endpoints/     # REST Endpoints
│   │   ├── core/              # Configuration
│   │   ├── models/            # Pydantic Models
│   │   └── services/          # Business Logic
│   │       ├── analysis/      # Visibility Analysis
│   │       ├── llm/           # AI Integration
│   │       └── supabase/      # Database
│   └── requirements.txt
│
├── frontend/                   # Next.js 15
│   ├── app/                   # App Router
│   │   ├── brand/[id]/        # Brand Panel
│   │   ├── dashboard/         # General Dashboard
│   │   ├── onboarding/        # Onboarding
│   │   └── settings/          # Settings
│   ├── components/
│   │   ├── brand/             # Brand Components
│   │   └── layout/            # Sidebar and Navigation
│   └── lib/
│       ├── demo/              # Demo Data and Logic
│       └── services/          # API Services
│
├── supabase/                   # Schema and Migrations
├── setup.py                    # Automated Setup
├── start.py                    # Unified Start
└── docker-compose.yml          # Docker for Development
```

---

## 🔧 Configuration

### Environment Variables

**Backend (`backend/.env`):**
```env
ENVIRONMENT=development
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
PERPLEXITY_API_KEY=pplx-...
DAILY_ANALYSIS_HOUR=03
DAILY_ANALYSIS_MINUTE=00
```

**Frontend (`frontend/.env.local`):**
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Automatic Daily Tracking

Daily analysis runs automatically at the configured time:
- `DAILY_ANALYSIS_HOUR`: Hour (00-23)
- `DAILY_ANALYSIS_MINUTE`: Minute (00-59)

Default: 03:00 AM

---

## 🐳 Docker

### Development
```bash
docker-compose up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Main API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/trigger/{brand_id}` | Trigger manual analysis |
| POST | `/api/analysis/daily-audit` | Daily analysis (scheduler) |
| GET | `/api/analysis/status/{brand_id}` | Analysis status |
| GET | `/api/brands/` | List brands |
| POST | `/api/brands/` | Create brand |
| GET | `/api/competitors/` | List competitors |
| GET | `/api/geo-analysis/brands/{id}/visibility` | Visibility data |
| GET | `/api/hallucinations` | Detected AI errors |
| GET | `/api/insights/{brand_id}` | Automated insights |

Full documentation: http://localhost:8000/docs

---

## 🎨 Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Python, FastAPI, Pydantic |
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS |
| **UI** | shadcn/ui, Radix UI, Lucide Icons |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth |
| **AIs** | OpenAI, Anthropic, Google, Perplexity |
| **Payments** | Stripe |

---

## 🔒 Security

- Authentication with Supabase Auth
- Row Level Security (RLS) for data isolation
- Encrypted API Keys
- Configured CORS

---

## 📈 Roadmap

- [x] AI presence audit
- [x] Hallucination detection
- [x] Competitor comparison
- [x] Automatic daily tracking
- [ ] Email alerts
- [ ] Public API
- [ ] CMS integrations
- [ ] White-label

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/NewFeature`
3. Commit: `git commit -m "Add new feature"`
4. Push: `git push origin feature/NewFeature`
5. Open a Pull Request

---

## 📝 License

Apache License 2.0 - See [LICENSE](LICENSE)

---

## 📞 Contact

- **Repository:** [GitHub](https://github.com/beenruuu/mentha)
- **Issues:** [Report issues](https://github.com/beenruuu/mentha/issues)

---

**Developed with 🌿 to optimize brand presence in the AI era**
