# Frontend Documentation

This document provides an overview of the frontend architecture, components, and integration points.

## Architecture Overview

The frontend is built using Next.js 15 with the App Router, React, and TypeScript. It uses Tailwind CSS with shadcn/ui components for styling and integrates with the backend API for data access.

### Tech Stack
- **Next.js 15**: React framework with App Router and server components
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Accessible component library built on Radix UI
- **Supabase Client**: For authentication
- **TypeScript**: For type safety
- **Lucide React**: Icon library

## Module Structure

```
frontend/
├── app/                      # Next.js App Router pages
│   ├── (auth)/               # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── admin/                # Admin dashboard
│   ├── brand/                # Brand management
│   │   ├── [id]/             # Brand details, competitors
│   │   └── new/              # Create new brand
│   ├── dashboard/            # Main dashboard
│   ├── keywords/             # Keyword tracking
│   ├── notifications/        # User notifications
│   ├── onboarding/           # Onboarding flow
│   ├── settings/             # User settings
│   ├── search/               # Search functionality
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/               # React components
│   ├── auth/                 # Authentication components
│   ├── brand/                # Brand-related components
│   ├── dashboard/            # Dashboard widgets
│   ├── landing/              # Landing page sections
│   ├── layout/               # Layout components (sidebar, header)
│   ├── onboarding/           # Onboarding flow steps
│   │   └── steps/            # Individual step components
│   ├── shared/               # Shared/common components
│   └── ui/                   # shadcn/ui components
├── hooks/                    # Custom React hooks
├── lib/                      # Utilities and services
│   ├── services/             # API service clients
│   ├── supabase/             # Supabase client configuration
│   ├── api.ts                # API client
│   └── i18n.ts               # Internationalization
├── public/                   # Static assets
├── middleware.ts             # Auth middleware
├── next.config.js            # Next.js configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with features, pricing, testimonials |
| `/login` | User login |
| `/register` | User registration |
| `/onboarding` | 7-step onboarding flow |
| `/dashboard` | Main dashboard with visibility metrics |
| `/brand/[id]` | Brand details and analysis |
| `/brand/[id]/competitors` | Competitor analysis |
| `/keywords` | Keyword tracking and rankings |
| `/notifications` | User notifications |
| `/settings` | User and organization settings |
| `/admin` | Admin panel (admin users only) |

## Onboarding Flow

The onboarding process consists of 7 steps:
1. **AboutYouStep** - User information
2. **CompanyStep** - Company URL and name
3. **BrandProfileStep** - Brand profile and categories
4. **CompetitorsStep** - Competitor discovery
5. **ResearchPromptsStep** - AI research prompts
6. **ScheduleStep** - AI model configuration
7. **SetupStep** - Save and trigger initial analysis

## Authentication Flow

1. User visits login/register page
2. Supabase Auth handles authentication (email or OAuth)
3. On success, user is redirected to dashboard
4. Middleware validates session on protected routes
5. Session is managed via Supabase client

## API Integration

The frontend communicates with the backend via REST API:
- API client in `lib/api.ts`
- Service modules in `lib/services/`
- Authentication headers managed automatically

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Internationalization

The app supports English and Spanish via `lib/i18n.ts`. Language selection is stored in user preferences.

## Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run linter
