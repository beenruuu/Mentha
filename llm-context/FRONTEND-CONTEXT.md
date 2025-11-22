# Frontend Documentation

This document provides an overview of the frontend architecture, components, and integration points.

## Architecture Overview

The frontend is built using Next.js, a React framework that enables server-side rendering, static site generation, and API routes. It uses Tailwind CSS for styling and integrates with the backend API for data access.

### Tech Stack
- **Next.js**: React framework with routing and server-side rendering
- **Tailwind CSS**: Utility-first CSS framework
- **Supabase Client**: For authentication and data storage
- **TypeScript**: For type safety

## Module Structure

```
frontend/
├── app/                      # Next.js app directory (App Router)
│   ├── auth/                 # Authentication related routes
│   │   └── callback/         # OAuth callback handler
│   ├── dashboard/            # Protected dashboard page
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout component
│   └── page.tsx              # Home page component
├── components/               # Reusable components
│   ├── auth/                 # Authentication components
│   │   └── LoginForm.tsx     # Login form with social providers
│   └── llm/                  # LLM integration components
│       └── TextGenerator.tsx # Component for text generation
├── services/                 # Service layer
│   ├── llm.ts                # LLM API client
│   └── supabase.ts           # Supabase client and auth utilities
├── public/                   # Static assets
├── Dockerfile                # Production Docker configuration
├── Dockerfile.dev            # Development Docker configuration
├── Makefile                  # Commands for development
├── package.json              # Project dependencies
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Components

### Authentication Flow

The application uses Supabase Authentication with the following flow:
1. User clicks on a social login button (Google, LinkedIn)
2. Supabase redirects to the provider's authentication page
3. After successful login, the provider redirects back to the app's callback URL
4. The callback handler exchanges the code for a session
5. User is redirected to the dashboard

### LLM Text Generation

The text generation component provides a UI to interact with language models:
1. User enters a prompt and selects settings (model, temperature, etc.)
2. The frontend sends a request to the backend API
3. The API proxies the request to the appropriate LLM provider
4. The response is displayed to the user with usage statistics

## Environment Variables

The following environment variables are required:
- `NEXT_PUBLIC_SUPABASE_URL`: URL of your Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon/Public key for Supabase
- `NEXT_PUBLIC_API_URL`: URL of the backend API

## Docker Setup

- **Development**: Uses hot-reloading for faster development
- **Production**: Multi-stage build for optimized bundle size

## Commands

- `make install`: Install dependencies
- `make dev`: Start development server
- `make build`: Build for production
- `make start`: Start production server
- `make lint`: Run linter
- `make clean`: Clean build artifacts
