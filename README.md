# Mentha - AI Engine Optimization Platform

[Mentha Dashboard Preview](#file:mentha-preview.png)

A complete SaaS platform for optimizing brand visibility in AI search engines and conversational assistants. Analyze, track, and improve your presence across ChatGPT, Claude, Perplexity, Gemini, and other AI models with actionable insights powered by advanced AI analysis.

## Tech Stack

- **Backend**: Python FastAPI, Pydantic
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Payments**: Stripe (subscriptions + webhooks)
- **AI**: OpenRouter (GPT-4, Claude 3.5 Sonnet, Perplexity, Gemini)
- **Deployment**: Vercel (Frontend) / Cloud Run or VPS (Backend)
- **UI**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Radix UI
- **Icons**: Lucide React
- **State Management**: React Hooks, Zustand

## 🚀 Features

### 🤖 AI Engine Optimization (AEO)
- Content Analysis: Deep analysis of your content for AI visibility
- Domain Scanning: Complete website evaluation for AI engine optimization
- AI-Powered Recommendations: Get actionable insights from GPT-4 and Claude
- Multi-Model Support: Analyze across ChatGPT, Claude, Perplexity, and Gemini
- Scoring System: Comprehensive AEO scores (0‑100) for your content
- Auto‑Ingestion Pipeline: Analysis results hydrate keywords, competitors, and crawler logs for the dashboard automatically

### 📊 Keyword Tracking
- AI Visibility Scores: Track how visible your keywords are in AI responses
- Multi-Model Tracking: Monitor mentions across different AI models
- Position Tracking: See where you rank in AI‑generated responses
- Trend Analysis: Identify improving and declining keyword performance
- Keyword Suggestions: AI‑generated keyword opportunities

### 👥 Competitor Analysis
- Visibility Comparison: See how you stack up against competitors
- Gap Analysis: Identify areas where competitors outperform you
- Strength Identification: Understand competitor advantages
- Opportunity Detection: Find keywords and topics to target

### 💳 Subscription Management
- Stripe Integration: Secure payment processing
- Multiple Plans: Starter, Pro, and Enterprise tiers
- Usage Tracking: Monitor API usage and limits
- Billing Portal: Self‑service subscription management

### 🔒 Security & Authentication
- Supabase Auth: Secure authentication with email and OAuth
- Row Level Security: Data isolation between users
- Protected Routes: Middleware‑based route protection
- Session Management: Secure session handling

### 🌟 New Features
- **Authority Nexus (Citation Strategy)**: Tracks brand citations across high‑authority sources (Wikipedia, G2, TechCrunch, etc.) and provides an authority score with a list of missing critical citations.
- **SGE Visual Generator**: Detects visual content gaps in your pages and generates optimized image prompts for Gemini/Nano Banana, helping you fill missing visuals automatically.

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- pnpm 9+ (preferred package manager for the frontend)
- Python 3.10+
- Supabase account
- Stripe account
- OpenAI/OpenRouter API key

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/beenruuu/Mentha.git
   cd Mentha
   ```
2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   # Windows
   .\\venv\\Scripts\\activate
   # Linux/Mac
   source venv/bin/activate

   pip install -r requirements.txt

   cp .env.example .env

   uvicorn app.main:app --reload
   ```
3. **Frontend Setup**
   ```bash
   cd frontend
   pnpm install

   cp .env.local.example .env.local

   pnpm dev
   ```
4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Configure authentication providers
5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📖 Documentation
- **[SETUP.md](SETUP.md)** – Complete setup and deployment guide
- **[CHANGELOG.md](CHANGELOG.md)** – Version history and changes

## 🏗️ Project Structure

```text
mentha/
├── backend/                   # Python FastAPI Backend
│   ├── app/
│   │   ├── api/              # API Endpoints
│   │   ├── core/             # Config & Security
│   │   ├── models/           # Pydantic Models
│   │   └── services/         # Business Logic (LLM, DB)
│   └── requirements.txt
├── frontend/                  # Next.js Frontend
│   ├── app/                  # App Router Pages
│   │   ├── dashboard/        # Main dashboard
│   │   ├── brand/            # Brand management
│   ├── components/           # React components
│   ├── lib/                  # Utilities & API Clients
│   │   ├── services/         # Frontend Services (Brands, Analysis)
│   │   └── supabase/         # Supabase Client
│   └── middleware.ts         # Auth Middleware
├── supabase/                 # Database schema and migrations
└── ...
```

## 🔐 Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_*= 

# AI APIs
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

## 🎨 Branding
- **Logo**: mentha.svg (mint leaf design)
- **Colors**:
  - Emerald/Mint: `#10b981`
  - White: `#ffffff`
  - Dark Gray: `#1f2937`

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m "Add some AmazingFeature"`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License
This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 📞 Contact
- **Author**: beenruuu
- **Repository**: [GitHub](https://github.com/beenruuu/mentha)
- **Issues**: [Report Issues](https://github.com/beenruuu/mentha/issues)

---

**Built with ❤️ to optimize brand visibility in the AI era**