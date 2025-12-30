# 🌿 Mentha — Control Your Brand in AI Engines
![Mentha](./frontend/public/mentha-preview.png)

> **The definitive open-source platform for Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).**

**Mentha** is a SaaS platform exclusively focused on **auditing and controlling brand presence in conversational AIs** like ChatGPT, Claude, Perplexity, and Gemini. It doesn't do traditional SEO. It doesn't generate "SEO content". It controls your brand narrative across the new AI frontiers.

---

## 🎯 Core Capabilities

### AI Presence Audit
- **Prompt Analysis**: Executes real-world queries across multiple LLMs.
- **Error Detection**: Identifies incorrect mentions, omissions, and "hallucinations" about your brand.
- **Citation Tracking**: Monitors where and how your owned content is being cited (or ignored).

### Optimization for Citation (AEO/GEO)
- **Technical Analysis**: Identifies which pages are crawled but not cited.
- **Structure Optimization**: Recommendations for RAG (Retrieval-Augmented Generation) friendly site architecture.
- **llms.txt Management**: Automated generation and validation of `llms.txt` and `llms-full.txt`.

### Control and Measurement
- **Visibility Score**: Real-time scores per AI engine (ChatGPT, Claude, Perplexity, Gemini).
- **Share of Voice**: Compare your brand visibility against assigned competitors.
- **Automated Insights**: Prioritized recommendations to win higher citation rates.

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (Backend)
- **Node.js 18+** & **pnpm 9+** (Frontend)
- **Supabase Account** (Database & Auth)
- **AI API Keys** (OpenAI, Anthropic, Google, Perplexity)

### 1. Clone the Repository
```bash
git clone https://github.com/beenruuu/Mentha.git
cd Mentha
```

### 2. Automated Setup
```bash
python setup.py
```
The script will guide you through:
- Supabase Project Configuration
- AI Provider API Keys
- Daily tracking hour (Snapshot scheduler)
- Optional: Stripe (Payments) & Qdrant (Embeddings)

### 3. Install Dependencies
**Backend:**
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate | Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd ../frontend
pnpm install
```

### 4. Database Setup
1. Create a project in [Supabase](https://supabase.com).
2. Run the schema in SQL Editor: [supabase/schema.sql](supabase/schema.sql).
3. (Optional) Apply migrations from [supabase/migrations/](supabase/migrations/).

### 5. Start the Application
```bash
python start.py
```
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📁 Project Structure

```
Mentha/
├── backend/                    # FastAPI API
│   ├── app/
│   │   ├── api/endpoints/     # REST Endpoints (Analysis, Brands, Geo, etc.)
│   │   ├── core/              # Config & Security
│   │   ├── models/            # Pydantic Schemas
│   │   └── services/          # Business Logic (LLM, Scrapers, Analysis)
│   └── requirements.txt
├── frontend/                   # Next.js 15
│   ├── app/                   # App Router (Dashboards, Brand Panels)
│   ├── components/            # UI components (Shadcn + Custom)
│   └── lib/                   # API Utilities & Services
├── supabase/                   # SQL Schema & Migrations
├── setup.py                    # Environment Auto-configurator
├── start.py                    # Unified Service Runner
└── docker-compose.yml          # Containerized Development
```

---

## ⚖️ AEO vs. SEO vs. Mentha

| Feature | Traditional SEO | Generic AI Content | **Mentha (AEO/GEO)** |
| :--- | :--- | :--- | :--- |
| **Goal** | Rank in Google Search | Generate blog posts | **Control Brand Narrative in AI** |
| **Metric** | Backlinks & CTR | Word count | **Brand Mention & Citation Rate** |
| **Targets** | 10 Blue Links | Social Media | **ChatGPT, Claude, Gemini, etc.** |
| **Reliability** | High lag | High Hallucinations | **Fact-checked AI Insights** |

---

## 📊 Main API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/trigger/{brand_id}` | Trigger manual AI audit |
| POST | `/api/analysis/daily-audit` | Execute scheduler (Daily Snapshot) |
| GET | `/api/geo-analysis/brands/{id}` | Detailed GEO visibility data |
| GET | `/api/hallucinations` | List detected brand errors |
| GET | `/api/llms-txt/generate` | Generate llms.txt configuration |
| GET | `/api/brands/` | Manage tracked brands |

---

## 🎨 Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Shadcn UI.
- **Backend**: Python 3.12+, FastAPI, Pydantic V2.
- **Database**: Supabase (PostgreSQL), Qdrant (Optional Vector DB).
- **AIs**: OpenAI (GPT-4), Anthropic (Claude 3.5), Google (Gemini), Perplexity.
- **Payments**: Stripe Integration.

---

## 🛣️ Roadmap
- [x] AI Presence Audit & Hallucination detection
- [x] Competitor Comparison (Share of Voice)
- [x] Automatic Daily Tracking
- [ ] Integration with GSC for AEO-impact tracking.
- [ ] Advanced Schema Graph visualization.
- [ ] Automated "llms.txt" validator.

---

## 🤝 Contributing
We welcome contributions! Please fork the repository and open a Pull Request for any features or bug fixes.

## 📄 License
Mentha is open-source and available under the **Apache License 2.0**.

---
**Developed with 🌿 to optimize brand presence in the AI era.**
