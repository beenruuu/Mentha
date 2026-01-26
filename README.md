# Mentha SaaS Platform

This repository contains the source code for the Mentha SaaS Platform, organized as a Monorepo using Turborepo.

## Structure

*   **`apps/api`**: Backend API (Node.js/Express). Handles authentication, database interactions, and specialized AEO logic.
*   **`apps/web`**: SaaS Dashboard (Next.js). The main user interface for the platform.
*   **`packages/core`**: Shared TypeScript libraries, types, and logic used by both API and Web.

## Getting Started

1.  Install dependencies:
    ```bash
    npm install
    # or
    pnpm install
    ```

2.  Run development environment:
    ```bash
    npm run dev
    # or
    turbo run dev
    ```

## Development

*   **Backend**: Located in `apps/api`. Runs on port 3000 by default.
*   **Frontend**: Located in `apps/web`. Runs on port 3001 by default.

## Deployment

This monorepo is configured to be deployed on platforms like Vercel (Frontend) and Railway/Render (Backend).
