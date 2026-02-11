# 🌿 Mentha GUI (V3.0 Enterprise)

> **The AEO/GEO Intelligence Platform** - Geo-Spatial, Agentic & Hallucination-Proof Brand Monitoring.

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## What is Mentha V3.0?

Mentha is an **Answer Engine Optimization (AEO)** platform designed for the AI Search era. It helps brands control their narrative in ChatGPT, Perplexity, and Google SGE by monitoring, evaluating, and optimizing their visibility deeply.

**New in V3.0 (Enterprise):**
*   🌍 **Geo-Spatial Intelligence**: Scans from specific locations (e.g., "Toys in Madrid" vs "Toys in London").
*   🧠 **Universal Entity Resolution**: Distinguishes your brand from generic words (e.g., "Action" the store vs "action" the verb).
*   🤖 **Agentic Fan-Out**: Uses AI Personas ("Bargain Hunter", "Skeptic", "Local Shopper") to generate natural, intent-driven searches.
*   ⚡ **Multi-Model Support**: Native integrations for **ChatGPT (OpenAI)**, **Perplexity**, **Gemini**, and **Claude (Anthropic)**.
*   🕵️ **Hallucination Monitor**: Automatically flags if the AI invents products, prices, or scams involving your brand.

---

## 📚 Deep Dive: What is AEO & GEO?
*(And why traditional SEO is dead)*

### 🧠 AEO (Answer Engine Optimization)
Is the art of optimizing your brand to appear in **ChatGPT, Claude, and Perplexity** responses. Users no longer search "best toys"; they ask "What are the safest durable toys for a 3-year-old in Madrid?". The AI synthesizes an answer. If you aren't in its training data or RAG sources, you don't exist.

### 🎨 GEO (Generative Engine Optimization)
Applies to multi-modal results (images, videos) in platforms like **Google Gemini (SGE)**. It's about convincing the AI that your content is the most authoritative source to cite.

### 🛑 Does Mentha fix this 100%?
**The Short Answer:** No tool can guarantee 100% visibility, because AI models are probabilistic non-deterministic black boxes. A model might "hallucinate" or prefer a competitor randomly.

**The Mentha Answer:** We maximize your **statistical probability** of appearing by:
1.  **Feeding the AI what it wants:** Structured Data (JSON-LD) and Knowledge Graphs.
2.  **Monitoring Reality:** We don't guess; we scan continuously to see *exactly* what the AI is saying about you today.
3.  **Correcting the Record:** If Claude thinks you sell "cheap plastic", Mentha guides you to inject "premium durability" facts into the sources Claude reads (E-E-A-T).

### 🚀 How to Optimize (The Strategy)
1.  **Be Explicit:** Use the **Knowledge Graph** to define your entity clearly. Ambiguity is the enemy.
2.  **Be Local:** Use **Mentha Geo** to ensure you exist in Madrid, not just "Global".
3.  **Be Referenced:** Getting mentioned in AI responses requires being mentioned in *trusted sources* (Reviews, News, Wikipedia). Mentha's **Share of Model** metric tells you if you are winning this battle.

---

## Applications

Mentha consists of three applications:

1. **Web Interface** (`apps/web`) - Next.js dashboard for visual analytics
2. **API Backend** (`apps/api`) - Express.js API server with all core services
3. **CLI Tool** (`apps/cli`) - Interactive command-line interface ⭐ NEW

---

## Features

| Category | Feature | Description |
|----------|---------|-------------|
| **Visual Dashboard** | **Real-Time Visibility** | Interactive charts showing Share of Model across timelines. |
| | **Sentiment Analysis** | **[NEW]** Track AI sentiment (Positive/Negative) trend lines visually. |
| | **Scan Logs** | Drill down into individual AI conversation logs to see exact prompts and answers. |
| **Monitoring** | **Multi-LLM Scanning** | Query **OpenAI**, **Perplexity**, **Gemini**, and **Claude** simultaneously. |
| | **Agentic Fan-Out** | **[NEW]** AI Personas generate 100+ variations of user queries. |
| **Optimization** | Knowledge Graph | UI to manage entities, claims, and FAQs in structured PostgreSQL. |
| | Authority Detail | Track which domains and sources are cited most frequently by AIs. |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Supabase account (or Docker)
- OpenAI API Key

### Installation

```bash
# Clone the repository
git clone https://github.com/beenruuu/mentha-gui.git
cd mentha-gui

# Install dependencies (using Turbo or npm direct)
cd apps/web
npm install

# Setup Environment
cp .env.example .env.local
# Edit .env.local with your Supabase and API keys
```

### Running

```bash
# Start the Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### CLI Usage

Run the interactive command-line interface:

```bash
# From project root
pnpm cli

# Or directly
./mentha.sh

# View available commands
pnpm cli -- --help
```

See [CLI Documentation](apps/cli/README.md) for detailed usage.

---

## Usage

### Dashboard Mode

The web interface provides a visual command center for your brand monitoring:

1.  **🚀 DASHBOARD**:
    *   **Visibility Chart**: See your brand's presence rate over the last 7/30 days.
    *   **AI Provider Breakdown**: Compare your performance on OpenAI vs Perplexity.
    *   **Live Scans**: Watch agents execute searches in real-time.

2.  **🧠 KNOWLEDGE GRAPH**:
    *   Manage your brand entities and structured data.
    *   Generate and validate `schema.org` JSON-LD snippets.

3.  **⭐ AUTHORITY**:
    *   **Citation Tracker**: See exactly *where* AIs are getting their information about you.
    *   **Competitor Analysis**: Spot which competitors are dominating specific keywords.

---

## Architecture

```
                    ┌─────────────────┐
                    │  Next.js GUI    │
                    │ (Browser / App) │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │   API       │    │  Knowledge  │    │   Agent     │
  │   Routes    │    │    Graph    │    │ Orchestrator│
  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                            ▼
                   ┌─────────────────┐
                   │   PostgreSQL    │
                   │   (Supabase)    │
                   └─────────────────┘
                            ▲
                            │
                   ┌────────┴─────────┐
                   │   CLI Tool       │
                   │  (Terminal UI)   │
                   └──────────────────┘
```

## Contributing

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run linting
npm run lint
```

### Code Style

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + CSS Modules for custom animations
- **Charts**: Chart.js for data visualization
- **State**: React Context + Hooks

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 🌿 by the Mentha team
</p>
