# Mentha - AI Engine Optimization Platform

![Mentha Dashboard Preview](preview.jpeg)

A complete SaaS platform for optimizing brand visibility in AI search engines and conversational assistants. Analyze, track, and improve your presence across ChatGPT, Claude, Perplexity, Gemini, and other AI models with actionable insights powered by advanced AI analysis.

## 🚀 Features

### 🤖 AI Engine Optimization (AEO)
- **Content Analysis**: Deep analysis of your content for AI visibility
- **Domain Scanning**: Complete website evaluation for AI engine optimization
- **AI-Powered Recommendations**: Get actionable insights from GPT-4 and Claude
- **Multi-Model Support**: Analyze across ChatGPT, Claude, Perplexity, and Gemini
- **Scoring System**: Comprehensive AEO scores (0-100) for your content

### 📊 Keyword Tracking
- **AI Visibility Scores**: Track how visible your keywords are in AI responses
- **Multi-Model Tracking**: Monitor mentions across different AI models
- **Position Tracking**: See where you rank in AI-generated responses
- **Trend Analysis**: Identify improving and declining keyword performance
- **Keyword Suggestions**: AI-generated keyword opportunities

### 👥 Competitor Analysis
- **Visibility Comparison**: See how you stack up against competitors
- **Gap Analysis**: Identify areas where competitors outperform you
- **Strength Identification**: Understand competitor advantages
- **Opportunity Detection**: Find keywords and topics to target

### 💳 Subscription Management
- **Stripe Integration**: Secure payment processing
- **Multiple Plans**: Starter, Pro, and Enterprise tiers
- **Usage Tracking**: Monitor API usage and limits
- **Billing Portal**: Self-service subscription management

### 🔒 Security & Authentication
- **Supabase Auth**: Secure authentication with email and OAuth
- **Row Level Security**: Data isolation between users
- **Protected Routes**: Middleware-based route protection
- **Session Management**: Secure session handling

## 🛠️ Technologies

- **Frontend**: Next.js 15.2.4 with App Router, TypeScript
- **UI**: Tailwind CSS 4.1.11, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **Payments**: Stripe (subscriptions + webhooks)
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Deployment**: Vercel/Fly.io ready
- **Icons**: Lucide React
- **State**: React Hooks, Zustand

## ⚡ Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Stripe account
- OpenAI API key
- Anthropic API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/beenruuu/Mentha.git
   cd Mentha
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Fill in all required environment variables (see SETUP.md for detailed instructions)

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `supabase/schema.sql` in the SQL Editor
   - Configure authentication providers

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Complete setup and deployment guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

## 🏗️ Project Structure

```
mentha/
├── app/                       # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── auth/            # Authentication endpoints
│   │   ├── aeo/             # AEO analysis endpoints
│   │   └── stripe/          # Stripe payment endpoints
│   ├── auth/                # Authentication pages
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   ├── aeo-analysis/        # AEO analysis interface
│   ├── keywords/            # Keyword tracking
│   ├── competitors/         # Competitor analysis
│   ├── dashboard/           # Main dashboard
│   └── settings/            # User settings
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   └── app-sidebar.tsx     # Navigation sidebar
├── lib/                    # Utilities and configurations
│   ├── supabase/          # Supabase client & middleware
│   ├── stripe/            # Stripe configuration
│   └── ai/                # AI service integrations
├── supabase/              # Database schema and migrations
├── public/                # Static assets
└── middleware.ts          # Next.js middleware for auth
```

## 🎯 Key Features Implementation

### Authentication Flow
- Email/password signup and login
- OAuth with Google (configurable)
- Automatic profile creation on signup
- Protected routes with middleware
- Session management with Supabase

### Payment Flow
1. User selects a plan
2. Stripe Checkout session created
3. Payment processed by Stripe
4. Webhook updates subscription in database
5. User gains access to features

### AEO Analysis Flow
1. User inputs domain and content
2. Content sent to AI (GPT-4 or Claude)
3. AI analyzes for optimization opportunities
4. Results stored in database
5. Recommendations generated
6. User receives actionable insights

## 📊 Database Schema

Key tables:
- `profiles` - User profiles
- `subscriptions` - Stripe subscriptions
- `brands` - Monitored brands
- `aeo_analyses` - AEO analysis results
- `keywords` - Tracked keywords
- `keyword_rankings` - AI model rankings
- `competitors` - Competitor data
- `recommendations` - AI-generated recommendations

All tables protected with Row Level Security (RLS).

## 🚢 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Fly.io
```bash
fly launch
fly deploy
```

See [SETUP.md](SETUP.md) for detailed deployment instructions.

## 🔐 Environment Variables

Required environment variables:

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
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Author**: beenruuu
- **Repository**: [GitHub](https://github.com/beenruuu/mentha)
- **Issues**: [Report Issues](https://github.com/beenruuu/mentha/issues)

## 🙏 Acknowledgments

Inspired by leading AEO platforms:
- Peec AI
- Goodie AI
- Profound
- Ahrefs
- Semrush
- Athena
- XFunnel
- Geostar

---

**Built with ❤️ to optimize brand visibility in the AI era**