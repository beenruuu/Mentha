# 🌿 Mentha GUI (v1.0 Stable)

> **The Professional Answer Engine Optimization (AEO) Platform.** 
> Monitor, Analyze, and Optimize your brand visibility across the AI Search ecosystem.

[![Version](https://img.shields.io/badge/Version-1.0_Stable-mentha?color=38B2AC)](https://github.com/beenruuu/mentha-gui)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Backend](https://img.shields.io/badge/API-Hono-FF6F00)](https://hono.dev/)
[![Queue](https://img.shields.io/badge/Queue-BullMQ-red)](https://bullmq.io/)
[![Database](https://img.shields.io/badge/ORM-Drizzle-C5F74F)](https://orm.drizzle.team/)

---

## 🚀 Welcome to Mentha v1.0
Mentha is a production-ready **Answer Engine Optimization (AEO)** platform. In a world where users ask ChatGPT and Perplexity instead of searching on Google, Mentha gives brands the tools to ensure they are being recommended accurately and positively.

### Key Features in v1.0
- **Universal Engine Support**: Native scanning for **Perplexity**, **ChatGPT (OpenAI)**, **Gemini**, and **Claude**.
- **Natural Language Analysis**: Unlike basic tools, Mentha captures the exact Markdown response from AI engines for human audit.
- **LLM-as-a-Judge**: Uses advanced models to evaluate brand visibility, sentiment, and competitor presence with high accuracy.
- **Brand Intelligence**: Inject your brand's unique description to help the system distinguish your entity from generic terms.
- **Enterprise Queue System**: Powered by **BullMQ** and **Redis** for reliable, parallelized scanning of thousands of keywords.
- **Real-time Dashboard**: Instant insights into your Share of Voice (SOV) and Engine Performance.

---

## 📁 Project Structure
Mentha is built as a modern TypeScript monorepo using **Turborepo** and **pnpm**:

- `apps/web`: **Next.js 14** (App Router) frontend with a premium design system.
- `apps/api`: **Hono** backend optimized for performance and type-safety.
- `apps/cli`: **Interactive CLI** for managing projects and scans from the terminal.
- `apps/mcp`: **Model Context Protocol** server for AI assistant integration.
- `packages/core`: Shared types and RPC clients.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TailwindCSS, Lucide Icons, Chart.js.
- **Backend**: Hono v4, Drizzle ORM, Zod validation.
- **Storage**: PostgreSQL (Primary), Redis (Queues & Cache).
- **Automation**: BullMQ for background workers.
- **AI Integration**: OpenRouter / OpenAI SDK.

---

## 🚦 Getting Started

### 1. Prerequisites
- **Node.js** v20+
- **pnpm** v9+
- **PostgreSQL** & **Redis** instances.

### 2. Installation
```bash
# Clone the repo
git clone https://github.com/beenruuu/mentha-gui.git
cd mentha-gui

# Install dependencies
pnpm install

# Setup Environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3. Database Migration
```bash
cd apps/api
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### 4. Running the Platform
```bash
# Start all services (Web, API, Workers)
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to start the onboarding flow.

---

## 📈 AEO Strategy with Mentha
1. **Onboard**: Connect your domain and provide a clear brand description.
2. **Suggest**: Let Mentha analyze your niche and suggest strategic keywords.
3. **Scan**: Run parallel scans across multiple AI engines.
4. **Analyze**: Identify why competitors are being cited and where you are missing.
5. **Optimize**: Use the insights to update your site's E-E-A-T and Knowledge Graph.

---

## 📄 License
MIT License. Built with 🌿 for the future of search.
