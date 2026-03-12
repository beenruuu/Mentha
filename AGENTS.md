# AGENTS.md

> **Technical guide for AI agents working on the mentha-gui project**

This document provides a comprehensive technical reference for AI agents to understand the architecture, conventions, and workflows of the mentha-gui monorepo.

---

## Table of Contents

- [🏗️ 1. Project Overview](#️-1-project-overview)
- [📁 2. Project Structure](#-2-project-structure)
- [⚙️ 3. Development Setup](#️-3-development-setup)
- [📏 4. Code Conventions](#-4-code-conventions)
- [🎯 5. Backend Architecture (Hono + Drizzle)](#-5-backend-architecture-hono--drizzle)
- [🖼️ 6. Frontend Architecture (Next.js 14)](#️-6-frontend-architecture-nextjs-14)
- [🗄️ 7. Database (Drizzle ORM)](#️-7-database-drizzle-orm)
- [⚡ 8. Background Jobs (BullMQ)](#-8-background-jobs-bullmq)
- [🔒 9. Authentication & Authorization](#-9-authentication--authorization)
- [🤖 10. Multi-LLM Integration](#-10-multi-llm-integration)
- [🔧 11. Type Safety](#-11-type-safety)
- [🧪 12. Testing](#-12-testing)
- [🚀 13. Common Workflows](#-13-common-workflows)
- [📦 14. CLI & MCP](#-14-cli--mcp)
- [⚡ 15. Quick Reference](#-15-quick-reference)
- [🔗 16. Important Files Reference](#-16-important-files-reference)

---

## 🏗️ 1. Project Overview

### What is Mentha-GUI?

Mentha-GUI is a **monorepo-based platform** for answer engine optimization (AEO). It consists of:
- **Web frontend** (Next.js 14 with App Router)
- **Backend API** (Hono framework with Drizzle ORM)
- **Interactive CLI** (Commander.js)
- **MCP Server** (Model Context Protocol for AI assistant integration)

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React 18, TypeScript 5, TailwindCSS |
| **Backend** | Hono 4.6, Drizzle ORM 0.45, PostgreSQL, Redis |
| **Validation** | Zod 3.23 |
| **Background Jobs** | BullMQ 5.12, IORedis 5.4 |
| **Auth** | JWT (jsonwebtoken + bcrypt) |
| **Logging** | Winston 3.14 |
| **AI/LLM** | OpenAI, Anthropic, Google Gemini, Perplexity |
| **Monorepo** | Turborepo + pnpm 9 |
| **Linter/Formatter** | Biome 2.3.15 |
| **Testing** | Jest 29.7 (configured, no tests yet) |

### Monorepo Architecture

```
mentha-gui/
├── apps/
│   ├── web         → Next.js 14 frontend
│   ├── api         → Hono backend API
│   ├── cli         → Commander.js CLI
│   └── mcp         → Model Context Protocol server
└── packages/
    └── core        → Shared types and RPC client
```

### Key Design Decisions

- **Type-safe end-to-end**: Zod schemas → Drizzle ORM → Hono RPC client
- **Singleton services**: Service layer uses singleton pattern for state management
- **Context API only**: Frontend uses React Context (no Redux/Zustand)
- **Manual fetching**: No React Query/SWR (custom `fetchFromApi` helper)
- **Biome over ESLint**: Modern, fast linting and formatting

---

## 📁 2. Project Structure

### Complete Directory Tree

```
mentha-gui/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App Router
│   │   │   ├── (platform)/           # Protected routes group
│   │   │   │   ├── dashboard/        # Main dashboard
│   │   │   │   ├── keywords/         # Keyword management
│   │   │   │   ├── optimization/     # Knowledge graph UI
│   │   │   │   ├── authority/        # Citation analysis
│   │   │   │   ├── settings/         # Settings page
│   │   │   │   └── layout.tsx        # Platform layout (with ProjectProvider)
│   │   │   ├── landing/              # Public landing page
│   │   │   ├── globals.css           # Global styles (786 lines)
│   │   │   ├── layout.tsx            # Root layout
│   │   │   └── page.tsx              # Homepage
│   │   ├── components/
│   │   │   ├── landing/              # Landing page components (11 files)
│   │   │   ├── layout/               # Header, Dock (navigation)
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   └── ThemeProvider.tsx     # next-themes wrapper
│   │   ├── context/
│   │   │   └── ProjectContext.tsx    # Global project state
│   │   ├── lib/
│   │   │   ├── api.ts                # Fetch helper
│   │   │   ├── utils.ts              # cn() utility
│   │   │   └── i18n.ts               # Internationalization
│   │   ├── types/                    # TypeScript types
│   │   ├── public/                   # Static assets
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   └── tsconfig.json
│   │
│   ├── api/                          # Hono backend
│   │   ├── src/
│   │   │   ├── app.ts                # Main Hono server
│   │   │   ├── config/
│   │   │   │   └── env.ts            # Environment validation (Zod)
│   │   │   ├── controllers/          # 10 controllers
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── dashboard.controller.ts
│   │   │   │   ├── keywords.controller.ts
│   │   │   │   ├── projects.controller.ts
│   │   │   │   └── ... (6 more)
│   │   │   ├── routers/              # 10 Hono routers
│   │   │   │   ├── auth.router.ts
│   │   │   │   ├── keywords.router.ts
│   │   │   │   └── ... (8 more)
│   │   │   ├── services/             # 14 business logic services
│   │   │   │   ├── keyword.service.ts
│   │   │   │   ├── project.service.ts
│   │   │   │   ├── analysis.service.ts
│   │   │   │   └── ... (11 more)
│   │   │   ├── core/                 # Core utilities
│   │   │   │   ├── logger.ts         # Winston logger
│   │   │   │   ├── queue.ts          # BullMQ queues (325 lines)
│   │   │   │   ├── cache.ts          # Redis cache
│   │   │   │   ├── rate-limit.ts     # Rate limiting
│   │   │   │   ├── rag.ts            # RAG implementation
│   │   │   │   ├── redteam.ts        # AI red teaming
│   │   │   │   └── search/           # Multi-LLM providers
│   │   │   │       ├── anthropic.provider.ts
│   │   │   │       ├── openai.provider.ts
│   │   │   │       ├── gemini.provider.ts
│   │   │   │       ├── perplexity.provider.ts
│   │   │   │       ├── factory.ts    # Provider factory
│   │   │   │       └── types.ts
│   │   │   ├── db/
│   │   │   │   ├── schema/           # Drizzle schemas
│   │   │   │   │   ├── core.ts       # Main tables (215 lines)
│   │   │   │   │   ├── knowledge-graph.ts
│   │   │   │   │   └── tenants.ts
│   │   │   │   ├── migrations/       # SQL migrations
│   │   │   │   ├── types.ts          # Inferred types
│   │   │   │   └── index.ts          # DB connection
│   │   │   ├── middlewares/
│   │   │   │   ├── auth.ts           # JWT middleware
│   │   │   │   └── ai-view.ts
│   │   │   ├── schemas/              # Zod validation schemas
│   │   │   │   ├── auth.schema.ts
│   │   │   │   ├── keyword.schema.ts
│   │   │   │   └── ... (more)
│   │   │   ├── exceptions/           # Custom HTTP exceptions
│   │   │   │   └── http.ts
│   │   │   └── workers/              # BullMQ workers
│   │   │       ├── index.ts
│   │   │       ├── scraper.worker.ts
│   │   │       └── analysis.worker.ts
│   │   ├── drizzle.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                          # Interactive CLI
│   │   └── src/
│   │       ├── cli.ts                # Commander setup
│   │       ├── client.ts             # Hono RPC client
│   │       ├── commands/             # CLI commands
│   │       │   ├── projects.ts
│   │       │   ├── keywords.ts
│   │       │   ├── scans.ts
│   │       │   ├── search.ts
│   │       │   ├── dashboard.ts
│   │       │   └── knowledge-graph.ts
│   │       └── utils/
│   │           ├── formatter.ts      # Chalk formatters
│   │           ├── table.ts          # cli-table3
│   │           └── prompt.ts         # Inquirer.js
│   │
│   └── mcp/                          # MCP Server
│       └── src/
│           ├── index.ts              # MCP server setup
│           ├── tools.ts              # MCP tools
│           ├── resources.ts          # MCP resources
│           ├── schemas.ts            # Zod schemas
│           └── constants.ts
│
├── packages/
│   └── core/                         # Shared package
│       └── src/
│           ├── client.ts             # Hono RPC client factory
│           ├── types.ts              # Shared types
│           └── index.ts
│
├── biome.json                        # Biome config (96 lines)
├── turbo.json                        # Turborepo config
├── tsconfig.base.json                # Base TypeScript config
├── pnpm-workspace.yaml               # PNPM workspace definition
├── package.json                      # Root package
└── README.md
```

### Where to Create Files

| File Type | Location | Example |
|-----------|----------|---------|
| API Controller | `apps/api/src/controllers/` | `projects.controller.ts` |
| API Router | `apps/api/src/routers/` | `projects.router.ts` |
| Service | `apps/api/src/services/` | `project.service.ts` |
| Zod Schema | `apps/api/src/schemas/` | `project.schema.ts` |
| DB Schema | `apps/api/src/db/schema/` | `core.ts` |
| Middleware | `apps/api/src/middlewares/` | `auth.ts` |
| Next.js Page | `apps/web/app/` | `dashboard/page.tsx` |
| UI Component | `apps/web/components/ui/` | `button.tsx` |
| Context | `apps/web/context/` | `ProjectContext.tsx` |
| CLI Command | `apps/cli/src/commands/` | `projects.ts` |

---

## ⚙️ 3. Development Setup

### Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: 9.0.0
- **PostgreSQL**: 14+ (running locally or remote)
- **Redis**: 6+ (required for BullMQ queues)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd mentha-gui

# Install dependencies (uses pnpm workspaces)
pnpm install

# Setup environment variables
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit .env files with your credentials
```

### Environment Variables

#### API (`apps/api/.env`)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mentha

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=7d
JWT_ISSUER=mentha-api

# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=pplx-...

# Server
PORT=4000
NODE_ENV=development
```

#### Web (`apps/web/.env`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

### Database Setup

```bash
# Navigate to API
cd apps/api

# Generate migration from schema
pnpm drizzle-kit generate

# Apply migrations
pnpm drizzle-kit migrate

# (Optional) Seed data
pnpm tsx src/db/seed.ts
```

### Running the Monorepo

```bash
# Development mode (all apps in parallel)
pnpm dev

# Or run specific apps
pnpm --filter mentha-web dev      # Next.js on :3000
pnpm --filter mentha-api dev      # Hono API on :4000
pnpm --filter mentha-cli start    # CLI interactive mode

# Build all apps
pnpm build

# Lint & format
pnpm check        # Check code style
pnpm check:fix    # Auto-fix issues
pnpm format       # Format code
```

### Verify Setup

```bash
# Test API
curl http://localhost:4000/api/v1/health

# Test database connection
cd apps/api && pnpm tsx -e "import { db } from './src/db'; db.select().from(require('./src/db/schema/core').profiles).limit(1).then(console.log)"

# Test Redis
redis-cli ping  # Should return PONG
```

---

## 📏 4. Code Conventions

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files | kebab-case | `auth.controller.ts`, `project-context.tsx` |
| Components | PascalCase | `ProjectProvider`, `MetricsGrid` |
| Functions/Variables | camelCase | `fetchFromApi`, `selectedProject` |
| Constants | UPPER_SNAKE_CASE | `QUEUE_NAMES`, `API_BASE_URL` |
| Interfaces/Types | PascalCase | `UserPayload`, `CreateKeywordInput` |
| Database Tables | snake_case | `scan_results`, `project_id` |

### File Organization

**Backend (API)**:
```
feature-name/
├── feature-name.controller.ts    # HTTP handlers
├── feature-name.service.ts       # Business logic
├── feature-name.router.ts        # Route definitions
└── feature-name.schema.ts        # Zod validation
```

**Frontend (Web)**:
```
feature/
├── page.tsx                      # Route page
├── layout.tsx                    # Layout (if needed)
└── components/                   # Feature-specific components
    ├── FeatureList.tsx
    └── FeatureForm.tsx
```

### Import Organization (Biome)

Imports are automatically organized by Biome into these groups:

1. URL imports
2. Bun/Node built-ins (`:BUN:`, `:NODE:`)
3. Packages with protocol
4. External packages (`:PACKAGE:`)
5. **[Blank line]**
6. Alias imports (`:ALIAS:` - e.g., `@/...`)
7. Relative imports (`:PATH:` - e.g., `./`, `../`)

**Example**:
```typescript
import { readFile } from 'node:fs/promises';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { logger } from '@/core/logger';
import { db } from '@/db';
import type { CreateProjectInput } from './types';
```

### Formatting Rules (Biome)

From `biome.json`:

- **Indentation**: 4 spaces (TypeScript/JS), 2 spaces (JSON)
- **Line width**: 100 characters
- **Semicolons**: Always required
- **Quotes**: Single quotes (code), double quotes (JSX)
- **Trailing commas**: Always
- **Arrow parentheses**: Always `(x) => x`
- **Bracket spacing**: Enabled `{ foo }`

### TypeScript Strictness

From `tsconfig.base.json`:

- `strict: true` (all strict checks enabled)
- `noUncheckedIndexedAccess: true` (array access returns `T | undefined`)
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

### Export Patterns

**Prefer named exports** for utilities, services, and types:
```typescript
// ✅ Good
export const fetchFromApi = async () => { ... };
export interface UserPayload { ... }
export class KeywordService { ... }
```

**Use default exports** for:
- Next.js pages/layouts
- React components (main component of file)
- Hono routers

**Use `as const` for immutable objects**:
```typescript
export const AuthController = {
    login: async (c) => { ... },
    register: async (c) => { ... },
} as const;

export const QUEUE_NAMES = {
    SCRAPERS: 'scrapers-queue',
    ANALYSIS: 'analysis-queue',
} as const;
```

### Comments Style

- Use JSDoc for public API functions:
```typescript
/**
 * Factory function to create or retrieve search providers
 * Uses caching to reuse provider instances
 *
 * @param type - The provider type to create
 * @returns The search provider instance
 */
export function createProvider(type: ProviderType): ISearchProvider {
    // ...
}
```

- Use inline comments sparingly (code should be self-documenting)
- Use section delimiters in long files:
```typescript
// =============================================================================
// PROFILES (synced from auth.users)
// =============================================================================
export const profiles = pgTable('profiles', { ... });
```

---

## 🎯 5. Backend Architecture (Hono + Drizzle)

### Architecture Diagram

```
HTTP Request
     ↓
[Router] ────────────→ Hono router + zValidator (Zod)
     ↓
[Middleware] ────────→ Auth, rate-limit, CORS, etc.
     ↓
[Controller] ────────→ HTTP handler (extract body, call service)
     ↓
[Service] ───────────→ Business logic (singleton class)
     ↓
[Drizzle ORM] ───────→ Type-safe SQL queries
     ↓
[PostgreSQL]

Side effects:
[Service] ──→ [BullMQ Queue] ──→ [Worker] ──→ [External API]
              [Redis Cache]
              [Logger]
```

### Layer Responsibilities

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Router** | Define routes, attach middlewares, validate input | `auth.router.ts` |
| **Controller** | Extract request data, call services, return responses | `auth.controller.ts` |
| **Service** | Business logic, database operations, orchestration | `keyword.service.ts` |
| **Schema** | Input validation with Zod | `auth.schema.ts` |
| **Middleware** | Auth, rate-limiting, logging, etc. | `auth.ts` |

### Router Pattern

**File**: `apps/api/src/routers/auth.router.ts`

```typescript
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { AuthController } from '../controllers/auth.controller';
import { createAuthRateLimiter } from '../core/rate-limit';
import { attachUser, requireAuth } from '../middlewares/auth';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

const router = new Hono()
    .post('/login', createAuthRateLimiter(5), zValidator('json', loginSchema), AuthController.login)
    .post(
        '/register',
        createAuthRateLimiter(3),
        zValidator('json', registerSchema),
        AuthController.register,
    )
    .get('/me', requireAuth, attachUser, AuthController.me);

export default router;
```

**Key points**:
- Use `zValidator('json', schema)` for input validation
- Chain middlewares before controller: `router.post(path, middleware1, middleware2, controller)`
- Export router as default

### Controller Pattern

**File**: `apps/api/src/controllers/auth.controller.ts`

Controllers are **objects with methods** (not classes):

```typescript
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { logger } from '../core/logger';
import { handleHttpException, UnauthorizedException } from '../exceptions/http';
import { generateToken } from '../middlewares/auth';
import { getProfileService } from '../services/profile.service';

const profileService = getProfileService();

export const AuthController = {
    login: async (c: Context) => {
        try {
            const body = await c.req.json();
            const { email, password } = body;

            const profile = await profileService.validateCredentials(email, password);
            if (!profile) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const token = await generateToken({
                id: profile.id,
                email: profile.email || undefined,
                role: profile.role || undefined,
            });

            logger.info('User logged in', { email: profile.email });

            return c.json({
                token,
                user: {
                    id: profile.id,
                    email: profile.email,
                    role: profile.role,
                    display_name: profile.display_name,
                    plan: profile.plan,
                },
            });
        } catch (error) {
            logger.error('Login failed', { error: (error as Error).message });
            return handleHttpException(c, error);
        }
    },

    me: async (c: Context) => {
        try {
            const user = c.get('user'); // From attachUser middleware

            if (!user) {
                throw new HTTPException(401, { message: 'Unauthorized' });
            }

            const profile = await profileService.findById(user.id);

            return c.json({
                user: {
                    id: profile.id,
                    email: profile.email,
                    display_name: profile.display_name,
                    role: profile.role,
                    plan: profile.plan,
                },
            });
        } catch (error) {
            logger.error('Failed to get user profile', {
                error: (error as Error).message,
            });
            return handleHttpException(c, error);
        }
    },
} as const;
```

**Key points**:
- Use `as const` to make controller immutable
- Always wrap in try-catch
- Use `logger` for important events
- Return `c.json()` or `c.text()` for responses
- Use custom exceptions from `exceptions/http.ts`

### Service Pattern (Singleton)

**File**: `apps/api/src/services/keyword.service.ts`

Services are **singleton classes**:

```typescript
import { desc, eq } from 'drizzle-orm';

import { logger } from '../core/logger';
import { db } from '../db';
import { keywords } from '../db/schema/core';
import type { InsertKeyword, Keyword } from '../db/types';
import { NotFoundException } from '../exceptions/http';

export interface CreateKeywordInput {
    project_id: string;
    query: string;
    intent?: 'informational' | 'transactional' | 'navigational' | 'commercial';
    scan_frequency?: 'daily' | 'weekly' | 'manual';
    engines?: Array<'perplexity' | 'openai' | 'gemini'>;
}

export class KeywordService {
    async list(filters?: KeywordFilters): Promise<Keyword[]> {
        logger.debug('Listing keywords', { filters });

        let query = db.select().from(keywords).orderBy(desc(keywords.created_at));

        if (filters?.projectId) {
            query = query.where(eq(keywords.project_id, filters.projectId)) as typeof query;
        }

        const data = await query;
        return data;
    }

    async getById(id: string): Promise<Keyword> {
        logger.debug('Getting keyword by ID', { id });

        const data = await db.select().from(keywords).where(eq(keywords.id, id)).limit(1);

        if (data.length === 0) {
            throw new NotFoundException('Keyword not found');
        }

        return data[0]!;
    }

    async create(input: CreateKeywordInput): Promise<Keyword> {
        logger.info('Creating keyword', { projectId: input.project_id, query: input.query });

        const keywordData: InsertKeyword = {
            project_id: input.project_id,
            query: input.query,
            intent: input.intent || 'informational',
            scan_frequency: input.scan_frequency || 'weekly',
            engines: input.engines || ['perplexity'],
            is_active: true,
        };

        const result = await db.insert(keywords).values(keywordData).returning();

        if (!result[0]) {
            throw new Error('Failed to create keyword');
        }

        logger.info('Keyword created successfully', { keywordId: result[0].id });
        return result[0];
    }

    async update(id: string, input: UpdateKeywordInput): Promise<Keyword> {
        logger.info('Updating keyword', { id, updates: Object.keys(input) });

        const result = await db
            .update(keywords)
            .set({
                ...input,
                updated_at: new Date(),
            })
            .where(eq(keywords.id, id))
            .returning();

        if (result.length === 0) {
            throw new NotFoundException('Keyword not found');
        }

        return result[0]!;
    }

    async delete(id: string): Promise<void> {
        logger.info('Deleting keyword', { id });

        const result = await db.delete(keywords).where(eq(keywords.id, id)).returning();

        if (result.length === 0) {
            throw new NotFoundException('Keyword not found');
        }
    }
}

// Singleton pattern
let keywordService: KeywordService | null = null;

export function getKeywordService(): KeywordService {
    if (!keywordService) {
        keywordService = new KeywordService();
    }
    return keywordService;
}
```

**Key points**:
- Use classes for services (not objects)
- Export `getServiceName()` singleton getter
- Use `logger` for all important operations
- Throw custom exceptions (`NotFoundException`, etc.)
- Use Drizzle ORM for all database operations

### Middleware Pattern

**File**: `apps/api/src/middlewares/auth.ts`

```typescript
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { jwt, sign } from 'hono/jwt';

import { env } from '../config/env';

export interface UserPayload {
    id: string;
    email?: string;
    role?: string;
}

// JWT verification middleware (built-in Hono)
export const requireAuth = jwt({
    secret: env.JWT_SECRET,
    alg: env.JWT_ALGORITHM,
});

// Custom middleware to attach user to context
export const attachUser = createMiddleware<{ Variables: { user: UserPayload } }>(
    async (c, next) => {
        const payload = c.get('jwtPayload');

        if (!payload || typeof payload !== 'object') {
            await next();
            return;
        }

        if ('sub' in payload) {
            const user: UserPayload = {
                id: payload.sub as string,
                email: (payload as { email?: string }).email,
                role: (payload as { role?: string }).role,
            };
            c.set('user', user);
        }

        await next();
    }
);

// Role-based access control
export const requireRole = (allowedRoles: string[]) => {
    return createMiddleware<{ Variables: { user: UserPayload } }>(async (c, next) => {
        const user = c.get('user');

        if (!user || !user.role) {
            throw new HTTPException(403, { message: 'Access denied' });
        }

        if (!allowedRoles.includes(user.role)) {
            throw new HTTPException(403, { message: 'Insufficient permissions' });
        }

        await next();
    });
};
```

### Error Handling

**Custom exceptions** (`apps/api/src/exceptions/http.ts`):

```typescript
import { HTTPException } from 'hono/http-exception';

export class NotFoundException extends HTTPException {
    constructor(message: string = 'Resource not found') {
        super(404, { message });
    }
}

export class UnauthorizedException extends HTTPException {
    constructor(message: string = 'Unauthorized') {
        super(401, { message });
    }
}

export class BadRequestException extends HTTPException {
    constructor(message: string = 'Bad request') {
        super(400, { message });
    }
}
```

**Global error handler** (in `app.ts`):

```typescript
app.onError((err, c) => {
    logger.error('Unhandled error', { error: err.message });
    
    if (err instanceof HTTPException) {
        return c.json({ error: err.message }, err.status);
    }
    
    return c.json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    }, 500);
});
```

---

## 🖼️ 6. Frontend Architecture (Next.js 14)

### App Router Structure

```
app/
├── layout.tsx              # Root layout (ThemeProvider)
├── page.tsx                # Homepage (/)
├── globals.css             # Global styles
├── (platform)/             # Route group (doesn't affect URL)
│   ├── layout.tsx          # Platform layout (ProjectProvider)
│   ├── dashboard/
│   │   └── page.tsx        # /dashboard
│   ├── keywords/
│   │   └── page.tsx        # /keywords
│   └── settings/
│       └── page.tsx        # /settings
└── landing/
    └── page.tsx            # /landing
```

**Route groups** `(name)`:
- Don't affect the URL structure
- Used to organize routes and apply shared layouts
- Example: `(platform)/dashboard/page.tsx` → URL is `/dashboard` (not `/platform/dashboard`)

### Client Component Pattern

**All interactive components must use `'use client'`** at the top:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

export default function KeywordsPage() {
    const { selectedProject } = useProject();
    const [keywords, setKeywords] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadKeywords() {
            if (!selectedProject?.id) return;

            setLoading(true);
            try {
                const { data } = await fetchFromApi(`/keywords?projectId=${selectedProject.id}`);
                setKeywords(data);
            } catch (error) {
                console.error('Failed to load keywords', error);
            } finally {
                setLoading(false);
            }
        }
        loadKeywords();
    }, [selectedProject?.id]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>Keywords</h1>
            <ul>
                {keywords.map((kw) => (
                    <li key={kw.id}>{kw.query}</li>
                ))}
            </ul>
        </div>
    );
}
```

**Key points**:
- `'use client'` directive at the top
- Use `useState` for local state
- Use `useEffect` for data fetching on mount
- Use Context hooks (`useProject()`) for global state
- Handle loading and error states manually

### Context API Pattern

**File**: `apps/web/context/ProjectContext.tsx`

```typescript
'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { fetchFromApi } from '@/lib/api';

interface Project {
    id: string;
    name: string;
    domain: string;
}

interface ProjectContextType {
    projects: Project[];
    selectedProject: Project | null;
    setSelectedProjectId: (id: string) => void;
    isLoading: boolean;
}

// 1. Create context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// 2. Provider component
export function ProjectProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadProjects() {
            try {
                const { data } = await fetchFromApi('/projects');
                setProjects(data);

                // Try to recover from localStorage or pick first
                const savedId = localStorage.getItem('mentha_project_id');
                if (savedId && data.find((p: Project) => p.id === savedId)) {
                    setSelectedProjectId(savedId);
                } else if (data.length > 0) {
                    setSelectedProjectId(data[0].id);
                    localStorage.setItem('mentha_project_id', data[0].id);
                }
            } catch (e) {
                console.error('Failed to load projects', e);
            } finally {
                setIsLoading(false);
            }
        }
        loadProjects();
    }, []);

    const selectedProject = projects.find((p) => p.id === selectedProjectId) || null;

    const handleSetSelectedProjectId = (id: string) => {
        setSelectedProjectId(id);
        localStorage.setItem('mentha_project_id', id);
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                selectedProject,
                setSelectedProjectId: handleSetSelectedProjectId,
                isLoading,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
}

// 3. Custom hook
export function useProject() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
```

**Usage in layout**:

```typescript
// apps/web/app/(platform)/layout.tsx
import { ProjectProvider } from '@/context/ProjectContext';

export default function PlatformLayout({ children }) {
    return (
        <ProjectProvider>
            {children}
        </ProjectProvider>
    );
}
```

### Fetch Pattern

**File**: `apps/web/lib/api.ts`

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `API error: ${res.status}`);
    }

    return res.json();
}
```

**Usage**:

```typescript
// GET
const { data } = await fetchFromApi('/projects');

// POST
const result = await fetchFromApi('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: 'New Project', domain: 'example.com' }),
});

// DELETE
await fetchFromApi(`/projects/${id}`, { method: 'DELETE' });
```

### Component with Variants Pattern

**File**: `apps/web/components/ui/button.tsx`

```typescript
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        const variants = {
            primary: 'bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black',
            secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            outline: 'border border-gray-300 hover:bg-gray-50',
            ghost: 'hover:bg-gray-100',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2 text-base',
            lg: 'px-6 py-3 text-lg',
        };

        return (
            <button
                ref={ref}
                className={cn(
                    'rounded-lg font-medium transition-colors',
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
```

**Usage**:

```typescript
<Button variant="primary" size="lg" onClick={handleClick}>
    Submit
</Button>
```

### Styling with Tailwind

**Utility**: `apps/web/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

**Usage**:

```typescript
<div className={cn(
    'base-styles',
    isActive && 'active-styles',
    'override-styles'
)}>
    Content
</div>
```

---

## 🗄️ 7. Database (Drizzle ORM)

### Schema Definition Pattern

**File**: `apps/api/src/db/schema/core.ts`

```typescript
import { relations, sql } from 'drizzle-orm';
import {
    boolean,
    check,
    index,
    integer,
    jsonb,
    pgTable,
    real,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

export const keywords = pgTable(
    'keywords',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        project_id: uuid('project_id').notNull(),
        query: text('query').notNull(),
        intent: text('intent').default('informational'),
        scan_frequency: text('scan_frequency').default('weekly'),
        engines: jsonb('engines').default(['perplexity']),
        is_active: boolean('is_active').default(true),
        last_scanned_at: timestamp('last_scanned_at', { withTimezone: true }),
        created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
        updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    },
    (table) => ({
        // Indexes
        projectIdIdx: index('idx_keywords_project_id').on(table.project_id),
        activeFrequencyIdx: index('idx_keywords_active_frequency').on(
            table.is_active,
            table.scan_frequency,
        ),
        
        // Constraints
        queryCheck: check('query_check', sql`char_length(query) >= 2`),
        intentCheck: check(
            'intent_check',
            sql`intent IN ('informational', 'transactional', 'navigational', 'commercial')`,
        ),
        frequencyCheck: check(
            'scan_frequency_check',
            sql`scan_frequency IN ('daily', 'weekly', 'manual')`,
        ),
    }),
);
```

### Relations Pattern

```typescript
export const keywordsRelations = relations(keywords, ({ one, many }) => ({
    // One-to-one / Many-to-one
    project: one(projects, {
        fields: [keywords.project_id],
        references: [projects.id],
    }),
    
    // One-to-many
    scanJobs: many(scanJobs),
}));
```

### Query Patterns

**Select**:
```typescript
// Simple select
const allKeywords = await db.select().from(keywords);

// With where clause
const activeKeywords = await db
    .select()
    .from(keywords)
    .where(eq(keywords.is_active, true));

// With multiple conditions
import { and, eq, gte } from 'drizzle-orm';

const filtered = await db
    .select()
    .from(keywords)
    .where(
        and(
            eq(keywords.project_id, projectId),
            eq(keywords.is_active, true),
            gte(keywords.created_at, startDate)
        )
    );

// With ordering and limit
const recent = await db
    .select()
    .from(keywords)
    .orderBy(desc(keywords.created_at))
    .limit(10);

// With joins
const keywordsWithProject = await db
    .select({
        keyword: keywords,
        project: projects,
    })
    .from(keywords)
    .leftJoin(projects, eq(keywords.project_id, projects.id));
```

**Insert**:
```typescript
// Single insert with returning
const result = await db
    .insert(keywords)
    .values({
        project_id: '...',
        query: 'search query',
        intent: 'informational',
    })
    .returning();

const newKeyword = result[0];

// Multiple insert
await db.insert(keywords).values([
    { project_id: '...', query: 'query 1' },
    { project_id: '...', query: 'query 2' },
]);
```

**Update**:
```typescript
const result = await db
    .update(keywords)
    .set({
        is_active: false,
        updated_at: new Date(),
    })
    .where(eq(keywords.id, keywordId))
    .returning();

if (result.length === 0) {
    throw new NotFoundException('Keyword not found');
}
```

**Delete**:
```typescript
const result = await db
    .delete(keywords)
    .where(eq(keywords.id, keywordId))
    .returning();
```

**Transactions**:
```typescript
await db.transaction(async (tx) => {
    const keyword = await tx.insert(keywords).values(data).returning();
    await tx.insert(scanJobs).values({ keyword_id: keyword[0].id });
});
```

### Type Inference

```typescript
// Infer types from schema
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { keywords } from './schema/core';

export type Keyword = InferSelectModel<typeof keywords>;
export type InsertKeyword = InferInsertModel<typeof keywords>;
```

### Migrations Workflow

```bash
# 1. Modify schema in src/db/schema/
# 2. Generate migration
pnpm drizzle-kit generate

# 3. Review generated SQL in drizzle/migrations/
# 4. Apply migration
pnpm drizzle-kit migrate

# 5. (Optional) Push schema directly without migrations
pnpm drizzle-kit push
```

**Drizzle Config** (`drizzle.config.ts`):
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema',
    out: './drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
```

---

## ⚡ 8. Background Jobs (BullMQ)

### Queue Setup

**File**: `apps/api/src/core/queue.ts`

```typescript
import { type JobsOptions, Queue } from 'bullmq';
import IORedis from 'ioredis';

// Queue names constant
export const QUEUE_NAMES = {
    SCRAPERS: 'scrapers-queue',
    ANALYSIS: 'analysis-queue',
    NOTIFICATIONS: 'notifications-queue',
    SCHEDULED: 'scheduled-queue',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Redis connection (singleton)
let sharedConnection: IORedis | null = null;

export function getRedisConnection(): IORedis {
    if (!sharedConnection) {
        sharedConnection = new IORedis(env.REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
        });
    }
    return sharedConnection;
}

// Queue cache
const queues = new Map<QueueName, Queue>();

export function getQueue<T>(name: QueueName): Queue<T> {
    let queue = queues.get(name);

    if (!queue) {
        queue = new Queue(name, {
            connection: getRedisConnection(),
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: {
                    age: 24 * 3600,
                    count: 1000,
                },
                removeOnFail: {
                    age: 7 * 24 * 3600,
                },
            },
        });
        queues.set(name, queue);
    }

    return queue as Queue<T>;
}
```

### Job Data Types

```typescript
export interface ScanJobData {
    keywordId: string;
    engine: 'perplexity' | 'openai' | 'gemini';
    projectId: string;
    query: string;
    brand: string;
    competitors: string[];
}

export interface AnalysisJobData {
    scanJobId: string;
    rawResponse: string;
    brand: string;
    competitors: string[];
}
```

### Adding Jobs

```typescript
export async function addScanJob(data: ScanJobData, options?: JobsOptions) {
    const queue = getQueue<ScanJobData>(QUEUE_NAMES.SCRAPERS);
    const job = await queue.add('scan', data, {
        priority: 2,
        ...options,
    });
    logger.info('Scan job added', {
        jobId: job.id,
        keywordId: data.keywordId,
        engine: data.engine,
    });
    return job;
}
```

### Recurring Jobs (Cron)

```typescript
const CRON_PATTERNS = {
    daily: '0 0 * * *',      // Midnight
    weekly: '0 0 * * 0',     // Sunday midnight
} as const;

export async function scheduleKeywordScan(
    keywordId: string,
    frequency: 'daily' | 'weekly',
    engines: string[],
): Promise<void> {
    const queue = getQueue<ScheduledJobData>(QUEUE_NAMES.SCHEDULED);
    const cronPattern = CRON_PATTERNS[frequency];
    
    // Add random jitter (0-59 minutes)
    const jitterMs = Math.floor(Math.random() * 59 * 60 * 1000);

    await queue.add(
        'scheduled-scan',
        { keywordId, engines },
        {
            repeat: {
                pattern: cronPattern,
                offset: jitterMs,
            },
            jobId: `recurring-${keywordId}`,
        },
    );

    logger.info('Keyword scheduled for recurring scan', {
        keywordId,
        frequency,
        cronPattern,
    });
}
```

### Worker Pattern

**File**: `apps/api/src/workers/scraper.worker.ts`

```typescript
import { Worker } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, type ScanJobData } from '../core/queue';
import { logger } from '../core/logger';
import { createProvider } from '../core/search/factory';

const worker = new Worker<ScanJobData>(
    QUEUE_NAMES.SCRAPERS,
    async (job) => {
        logger.info('Processing scan job', { jobId: job.id, data: job.data });

        const { keywordId, engine, query } = job.data;

        try {
            // Get LLM provider
            const provider = createProvider(engine);

            // Perform search
            const response = await provider.search(query);

            // Save to database
            // ... (insert into scan_results)

            logger.info('Scan job completed', { jobId: job.id });
            return { success: true, response };
        } catch (error) {
            logger.error('Scan job failed', { jobId: job.id, error: (error as Error).message });
            throw error; // Will retry according to backoff config
        }
    },
    {
        connection: getRedisConnection(),
        concurrency: 5, // Process 5 jobs in parallel
    }
);

worker.on('completed', (job) => {
    logger.debug('Job completed', { jobId: job.id });
});

worker.on('failed', (job, err) => {
    logger.error('Job failed', { jobId: job?.id, error: err.message });
});

export default worker;
```

### Starting Workers

**File**: `apps/api/src/workers/index.ts`

```typescript
import scraperWorker from './scraper.worker';
import analysisWorker from './analysis.worker';

// Workers start automatically on import
console.log('Workers started');
```

**Run**: `pnpm --filter mentha-api start:worker`

---

## 🔒 9. Authentication & Authorization

### JWT Flow Diagram

```
1. Login Request
   ↓
2. Controller → Service validates credentials
   ↓
3. Generate JWT token (with payload: id, email, role)
   ↓
4. Return { token, user }
   ↓
5. Client stores token (localStorage, cookie)
   ↓
6. Subsequent requests include: Authorization: Bearer <token>
   ↓
7. requireAuth middleware validates token
   ↓
8. attachUser middleware extracts user from payload
   ↓
9. Controller accesses user via c.get('user')
```

### Token Generation

**File**: `apps/api/src/middlewares/auth.ts`

```typescript
import { sign } from 'hono/jwt';
import { env } from '../config/env';

export interface UserPayload {
    id: string;
    email?: string;
    role?: string;
}

export async function generateToken(user: UserPayload): Promise<string> {
    const expirationSeconds = parseExpiration(env.JWT_EXPIRES_IN); // e.g., "7d" → 604800

    const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
        iat: Math.floor(Date.now() / 1000),
        iss: env.JWT_ISSUER,
    };

    return await sign(payload, env.JWT_SECRET, env.JWT_ALGORITHM);
}
```

### Protected Routes

```typescript
import { Hono } from 'hono';
import { requireAuth, attachUser, requireRole } from '../middlewares/auth';

const router = new Hono()
    // Public route
    .get('/health', (c) => c.json({ status: 'ok' }))
    
    // Authenticated route
    .get('/me', requireAuth, attachUser, AuthController.me)
    
    // Admin-only route
    .delete('/users/:id', requireAuth, attachUser, requireRole(['admin']), UserController.delete);
```

### Accessing User in Controller

```typescript
export const ProjectController = {
    list: async (c: Context) => {
        const user = c.get('user'); // UserPayload from middleware
        
        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }
        
        const projects = await projectService.listByUserId(user.id);
        return c.json({ data: projects });
    },
};
```

---

## 🤖 10. Multi-LLM Integration

### Provider Factory Pattern

**File**: `apps/api/src/core/search/factory.ts`

```typescript
import type { ISearchProvider, ProviderType } from "./types";
import { AnthropicProvider } from "./anthropic.provider";
import { GeminiProvider } from "./gemini.provider";
import { OpenAIProvider } from "./openai.provider";
import { PerplexityProvider } from "./perplexity.provider";

const providerCache = new Map<ProviderType, ISearchProvider>();

export function createProvider(type: ProviderType): ISearchProvider {
    let provider = providerCache.get(type);

    if (!provider) {
        switch (type) {
            case "perplexity":
                provider = new PerplexityProvider();
                break;
            case "openai":
                provider = new OpenAIProvider();
                break;
            case "gemini":
                provider = new GeminiProvider();
                break;
            case "claude":
                provider = new AnthropicProvider();
                break;
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }

        providerCache.set(type, provider);
        logger.debug(`Created provider: ${type}`);
    }

    return provider;
}
```

### Provider Interface

```typescript
export type ProviderType = 'perplexity' | 'openai' | 'gemini' | 'claude';

export interface ISearchProvider {
    search(query: string, options?: SearchOptions): Promise<SearchResponse>;
    testConnection(): Promise<boolean>;
}

export interface SearchResponse {
    answer: string;
    sources: Array<{
        url: string;
        title: string;
        snippet?: string;
    }>;
    model: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
```

### Using Providers

```typescript
import { createProvider } from '../core/search/factory';

// In service
const provider = createProvider('perplexity');
const response = await provider.search('What is Next.js?');

console.log(response.answer);
console.log(response.sources);
```

### Available Providers

| Provider | Model | Use Case |
|----------|-------|----------|
| **Perplexity** | `sonar-pro` | Real-time web search with citations |
| **OpenAI** | `gpt-4o` | General Q&A, structured output |
| **Gemini** | `gemini-2.0-flash-exp` | Fast inference, multimodal |
| **Anthropic** | `claude-3-5-sonnet` | Long context, reasoning tasks |

---

## 🔧 11. Type Safety

### End-to-End Type Flow

```
1. Zod Schema (validation)
        ↓
2. TypeScript Type (via z.infer<>)
        ↓
3. Drizzle Schema (database)
        ↓
4. Inferred Types (InferSelectModel)
        ↓
5. Hono RPC (type-safe API client)
        ↓
6. Frontend (full type safety)
```

### Zod Schema → TypeScript Type

```typescript
// apps/api/src/schemas/project.schema.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    domain: z.string().url('Must be a valid URL'),
    description: z.string().optional(),
    competitors: z.array(z.string().url()).optional(),
});

// Infer TypeScript type
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
// Result:
// {
//   name: string;
//   domain: string;
//   description?: string;
//   competitors?: string[];
// }
```

### Drizzle Schema → TypeScript Type

```typescript
// apps/api/src/db/schema/core.ts
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    domain: text('domain').notNull(),
    created_at: timestamp('created_at').defaultNow(),
});

// apps/api/src/db/types.ts
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { projects } from './schema/core';

export type Project = InferSelectModel<typeof projects>;
// {
//   id: string;
//   name: string;
//   domain: string;
//   created_at: Date | null;
// }

export type InsertProject = InferInsertModel<typeof projects>;
// {
//   id?: string;
//   name: string;
//   domain: string;
//   created_at?: Date;
// }
```

### Hono RPC (Type-Safe API Client)

**Backend** (`apps/api/src/app.ts`):
```typescript
import { Hono } from 'hono';
import projectsRouter from './routers/projects.router';

const app = new Hono()
    .basePath('/api/v1')
    .route('/projects', projectsRouter);

export type AppType = typeof app;
export default app;
```

**Frontend** (`packages/core/src/client.ts`):
```typescript
import { hc } from 'hono/client';
import type { AppType } from 'mentha-api'; // Import from API

export function createMenthaClient<T extends AppType>(options: {
    baseUrl: string;
    auth?: { token: string };
}) {
    return hc<T>(options.baseUrl, {
        headers: options.auth ? { Authorization: `Bearer ${options.auth.token}` } : {},
    });
}

// Usage
const client = createMenthaClient<AppType>({
    baseUrl: 'http://localhost:4000',
    auth: { token: 'jwt-token' },
});

// Fully type-safe!
const response = await client.api.v1.projects.$get();
const projects = await response.json(); // Type: Project[]
```

---

## 🧪 12. Testing

### Current State

- **Framework**: Jest 29.7 configured in `apps/api`
- **TypeScript support**: ts-jest 29.2
- **Status**: **No tests written yet** (0% coverage)

### Available Commands

```bash
# Run all tests
pnpm --filter mentha-api test

# Run unit tests only
pnpm --filter mentha-api test:unit

# Run integration tests only
pnpm --filter mentha-api test:integration

# Watch mode
pnpm --filter mentha-api test -- --watch
```

### How to Write Tests

#### Unit Test Template (Service)

**File**: `apps/api/src/services/__tests__/keyword.service.test.ts`

```typescript
import { describe, expect, it, beforeEach, jest } from '@jest/globals';
import { KeywordService } from '../keyword.service';
import { db } from '../../db';

jest.mock('../../db');

describe('KeywordService', () => {
    let service: KeywordService;

    beforeEach(() => {
        service = new KeywordService();
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a keyword successfully', async () => {
            const input = {
                project_id: 'project-123',
                query: 'test query',
                intent: 'informational' as const,
            };

            const mockResult = { id: 'keyword-123', ...input };
            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([mockResult]),
                }),
            });

            const result = await service.create(input);

            expect(result).toEqual(mockResult);
            expect(db.insert).toHaveBeenCalledWith(expect.anything());
        });

        it('should throw error if creation fails', async () => {
            (db.insert as jest.Mock).mockReturnValue({
                values: jest.fn().mockReturnValue({
                    returning: jest.fn().mockResolvedValue([]),
                }),
            });

            await expect(service.create({} as any)).rejects.toThrow('Failed to create keyword');
        });
    });
});
```

#### Integration Test Template (API)

**File**: `apps/api/src/controllers/__tests__/auth.controller.integration.test.ts`

```typescript
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import app from '../../app';

describe('Auth API', () => {
    beforeAll(async () => {
        // Setup test database
    });

    afterAll(async () => {
        // Cleanup
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'password123',
                }),
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveProperty('token');
            expect(data).toHaveProperty('user');
        });

        it('should return 401 with invalid credentials', async () => {
            const res = await app.request('/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                }),
            });

            expect(res.status).toBe(401);
        });
    });
});
```

### Jest Configuration

**File**: `apps/api/package.json`

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "testMatch": ["**/__tests__/**/*.test.ts"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/db/migrations/**"
    ]
  }
}
```

---

## 🚀 13. Common Workflows

### Workflow 1: Adding a New API Endpoint

**Goal**: Create a new endpoint `GET /api/v1/keywords/:id`

**Steps**:

1. **Define Zod schema** (`apps/api/src/schemas/keyword.schema.ts`):
```typescript
import { z } from 'zod';

export const getKeywordSchema = z.object({
    id: z.string().uuid('Invalid keyword ID'),
});
```

2. **Create/update controller** (`apps/api/src/controllers/keywords.controller.ts`):
```typescript
export const KeywordController = {
    getById: async (c: Context) => {
        const { id } = c.req.param();
        const keyword = await keywordService.getById(id);
        return c.json({ data: keyword });
    },
} as const;
```

3. **Add route** (`apps/api/src/routers/keywords.router.ts`):
```typescript
import { Hono } from 'hono';
import { KeywordController } from '../controllers/keywords.controller';
import { requireAuth, attachUser } from '../middlewares/auth';

const router = new Hono()
    .get('/:id', requireAuth, attachUser, KeywordController.getById);

export default router;
```

4. **Register router** (in `apps/api/src/app.ts`):
```typescript
import keywordsRouter from './routers/keywords.router';

const app = new Hono()
    .basePath('/api/v1')
    .route('/keywords', keywordsRouter);
```

5. **Test**:
```bash
curl http://localhost:4000/api/v1/keywords/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <token>"
```

---

### Workflow 2: Creating a New Database Table

**Goal**: Add a new `tags` table

**Steps**:

1. **Define schema** (`apps/api/src/db/schema/core.ts`):
```typescript
export const tags = pgTable(
    'tags',
    {
        id: uuid('id').defaultRandom().primaryKey(),
        name: text('name').notNull().unique(),
        color: text('color'),
        created_at: timestamp('created_at').defaultNow(),
    },
    (table) => ({
        nameIdx: index('idx_tags_name').on(table.name),
    })
);

// Add relations if needed
export const tagsRelations = relations(tags, ({ many }) => ({
    keywordTags: many(keywordTags),
}));
```

2. **Generate migration**:
```bash
cd apps/api
pnpm drizzle-kit generate
```

3. **Review migration** (check `drizzle/migrations/XXXX_create_tags.sql`):
```sql
CREATE TABLE "tags" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL UNIQUE,
    "color" text,
    "created_at" timestamp DEFAULT now()
);

CREATE INDEX "idx_tags_name" ON "tags" ("name");
```

4. **Apply migration**:
```bash
pnpm drizzle-kit migrate
```

5. **Infer types** (`apps/api/src/db/types.ts`):
```typescript
export type Tag = InferSelectModel<typeof tags>;
export type InsertTag = InferInsertModel<typeof tags>;
```

6. **Create service** (`apps/api/src/services/tag.service.ts`):
```typescript
export class TagService {
    async list(): Promise<Tag[]> {
        return await db.select().from(tags);
    }

    async create(name: string, color?: string): Promise<Tag> {
        const result = await db.insert(tags).values({ name, color }).returning();
        return result[0]!;
    }
}

let tagService: TagService | null = null;
export function getTagService(): TagService {
    if (!tagService) tagService = new TagService();
    return tagService;
}
```

---

### Workflow 3: Adding a New Page (Frontend)

**Goal**: Create a new page at `/reports`

**Steps**:

1. **Create page file** (`apps/web/app/(platform)/reports/page.tsx`):
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useProject } from '@/context/ProjectContext';
import { fetchFromApi } from '@/lib/api';

export default function ReportsPage() {
    const { selectedProject } = useProject();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedProject?.id) return;

        async function loadReports() {
            setLoading(true);
            try {
                const { data } = await fetchFromApi(`/reports?projectId=${selectedProject.id}`);
                setReports(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadReports();
    }, [selectedProject?.id]);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold">Reports</h1>
            <ul>
                {reports.map((report) => (
                    <li key={report.id}>{report.name}</li>
                ))}
            </ul>
        </div>
    );
}
```

2. **Add to navigation** (`apps/web/components/layout/Dock.tsx`):
```typescript
const menuItems = [
    { href: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { href: '/keywords', icon: SearchIcon, label: 'Keywords' },
    { href: '/reports', icon: ChartIcon, label: 'Reports' }, // New item
];
```

3. **Test**: Navigate to `http://localhost:3000/reports`

---

### Workflow 4: Adding a Background Job

**Goal**: Create a job to send weekly digest emails

**Steps**:

1. **Define job data type** (`apps/api/src/core/queue.ts`):
```typescript
export interface WeeklyDigestJobData {
    userId: string;
    projectId: string;
}
```

2. **Create job adder function**:
```typescript
export async function addWeeklyDigestJob(data: WeeklyDigestJobData) {
    const queue = getQueue<WeeklyDigestJobData>(QUEUE_NAMES.NOTIFICATIONS);
    return await queue.add('weekly-digest', data);
}
```

3. **Create worker** (`apps/api/src/workers/digest.worker.ts`):
```typescript
import { Worker } from 'bullmq';
import { QUEUE_NAMES, getRedisConnection, type WeeklyDigestJobData } from '../core/queue';
import { logger } from '../core/logger';

const worker = new Worker<WeeklyDigestJobData>(
    QUEUE_NAMES.NOTIFICATIONS,
    async (job) => {
        logger.info('Processing weekly digest', { jobId: job.id });

        const { userId, projectId } = job.data;

        // 1. Fetch data from database
        // 2. Generate digest content
        // 3. Send email

        logger.info('Weekly digest sent', { userId, projectId });
    },
    {
        connection: getRedisConnection(),
    }
);

export default worker;
```

4. **Register worker** (`apps/api/src/workers/index.ts`):
```typescript
import digestWorker from './digest.worker';
// Worker starts automatically
```

5. **Schedule recurring job** (in service or cron):
```typescript
import { addWeeklyDigestJob } from '../core/queue';

// Schedule for every Sunday at midnight
await queue.add('weekly-digest', data, {
    repeat: {
        pattern: '0 0 * * 0', // Cron pattern
    },
});
```

---

### Workflow 5: Debugging Tips

**Enable debug logs**:
```bash
# In .env
LOG_LEVEL=debug
```

**Check queue status**:
```typescript
import { getQueue, QUEUE_NAMES } from './core/queue';

const queue = getQueue(QUEUE_NAMES.SCRAPERS);
const waiting = await queue.getWaitingCount();
const active = await queue.getActiveCount();
const failed = await queue.getFailedCount();

console.log({ waiting, active, failed });
```

**Inspect database**:
```bash
# Connect to PostgreSQL
psql $DATABASE_URL

# List tables
\dt

# Query
SELECT * FROM keywords LIMIT 10;
```

**Check Redis**:
```bash
redis-cli
> KEYS *
> GET key-name
```

**View BullMQ board** (install `bull-board`):
```typescript
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { HonoAdapter } from '@bull-board/hono';

const serverAdapter = new HonoAdapter();

createBullBoard({
    queues: [new BullMQAdapter(getQueue(QUEUE_NAMES.SCRAPERS))],
    serverAdapter,
});

app.route('/admin/queues', serverAdapter.registerPlugin());
// Visit: http://localhost:4000/admin/queues
```

---

## 📦 14. CLI & MCP

### CLI Architecture

**File**: `apps/cli/src/cli.ts`

```typescript
import { Command } from 'commander';
import projectsCommand from './commands/projects';
import keywordsCommand from './commands/keywords';

const program = new Command();

program
    .name('mentha')
    .description('Mentha CLI for AEO management')
    .version('1.0.0');

program.addCommand(projectsCommand);
program.addCommand(keywordsCommand);

program.parse();
```

**Command structure** (`apps/cli/src/commands/projects.ts`):

```typescript
import { Command } from 'commander';
import { client } from '../client';
import { displayTable } from '../utils/table';

const projectsCommand = new Command('projects')
    .description('Manage projects');

projectsCommand
    .command('list')
    .description('List all projects')
    .action(async () => {
        const response = await client.api.v1.projects.$get();
        const { data } = await response.json();
        
        displayTable(data, ['id', 'name', 'domain']);
    });

projectsCommand
    .command('create')
    .description('Create a new project')
    .action(async () => {
        const inquirer = (await import('inquirer')).default;
        
        const answers = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Project name:' },
            { type: 'input', name: 'domain', message: 'Domain:' },
        ]);
        
        const response = await client.api.v1.projects.$post({ json: answers });
        console.log('✅ Project created');
    });

export default projectsCommand;
```

**Usage**:
```bash
pnpm cli projects list
pnpm cli projects create
pnpm cli keywords scan --keyword-id=123
```

### MCP (Model Context Protocol)

The MCP server allows AI assistants to interact with Mentha programmatically.

**File**: `apps/mcp/src/index.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
    name: 'mentha-mcp',
    version: '1.0.0',
});

// Register tools
server.setRequestHandler('tools/list', async () => ({
    tools: [
        {
            name: 'list_projects',
            description: 'List all projects',
            inputSchema: { type: 'object', properties: {} },
        },
        {
            name: 'create_keyword',
            description: 'Create a new keyword',
            inputSchema: {
                type: 'object',
                properties: {
                    project_id: { type: 'string' },
                    query: { type: 'string' },
                },
                required: ['project_id', 'query'],
            },
        },
    ],
}));

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Usage**: Configure in Claude Desktop or other MCP-compatible assistants.

---

## ⚡ 15. Quick Reference

### Essential Commands Cheatsheet

| Task | Command |
|------|---------|
| **Development** | |
| Start all apps | `pnpm dev` |
| Start web only | `pnpm --filter mentha-web dev` |
| Start API only | `pnpm --filter mentha-api dev` |
| Start workers | `pnpm --filter mentha-api start:worker` |
| **Build** | |
| Build all | `pnpm build` |
| Build web | `pnpm --filter mentha-web build` |
| Build API | `pnpm --filter mentha-api build` |
| **Linting/Formatting** | |
| Check code style | `pnpm check` |
| Auto-fix issues | `pnpm check:fix` |
| Format code | `pnpm format` |
| **Database** | |
| Generate migration | `cd apps/api && pnpm drizzle-kit generate` |
| Apply migrations | `cd apps/api && pnpm drizzle-kit migrate` |
| Push schema (no migration) | `cd apps/api && pnpm drizzle-kit push` |
| Open Drizzle Studio | `cd apps/api && pnpm drizzle-kit studio` |
| **Testing** | |
| Run tests | `pnpm --filter mentha-api test` |
| Run unit tests | `pnpm --filter mentha-api test:unit` |
| Watch mode | `pnpm --filter mentha-api test -- --watch` |
| **CLI** | |
| Run CLI | `pnpm cli` |
| CLI help | `pnpm cli --help` |

### File Location Map

| What to create | Where to put it |
|----------------|-----------------|
| New API endpoint | Controller → Router → Service → Schema |
| New page | `apps/web/app/(platform)/page-name/page.tsx` |
| New component | `apps/web/components/ui/ComponentName.tsx` |
| New database table | `apps/api/src/db/schema/core.ts` |
| New service | `apps/api/src/services/feature.service.ts` |
| New middleware | `apps/api/src/middlewares/feature.ts` |
| New background job | `apps/api/src/workers/feature.worker.ts` |
| New Zod schema | `apps/api/src/schemas/feature.schema.ts` |
| New context | `apps/web/context/FeatureContext.tsx` |

### Common Patterns Summary

| Pattern | Usage |
|---------|-------|
| **Singleton service** | `getServiceName()` function |
| **Controller** | Object with methods + `as const` |
| **Zod validation** | `zValidator('json', schema)` in router |
| **Auth middleware** | `requireAuth, attachUser` chain |
| **Drizzle queries** | `db.select().from(table).where(eq(...))` |
| **Context** | `createContext` → `Provider` → `useHook` |
| **Fetch helper** | `fetchFromApi(endpoint, options)` |
| **Provider factory** | `createProvider(type)` with cache |
| **Queue job** | `getQueue(NAME).add(jobName, data)` |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `lsof -ti:4000 \| xargs kill -9` |
| Database connection error | Check `DATABASE_URL` in `.env` |
| Redis connection error | Ensure Redis is running: `redis-cli ping` |
| Migration fails | Rollback: Delete migration file and re-generate |
| Type errors | Run `pnpm --filter <package> typecheck` |
| Biome errors | Run `pnpm check:fix` to auto-fix |
| Worker not processing jobs | Check `pnpm start:worker` is running |
| Frontend can't reach API | Verify `NEXT_PUBLIC_API_URL` in web `.env` |

---

## 🔗 16. Important Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `biome.json` | Linter and formatter config (indentation, line width, rules) |
| `turbo.json` | Turborepo task configuration |
| `tsconfig.base.json` | Base TypeScript config for all packages |
| `pnpm-workspace.yaml` | PNPM workspace definition |
| `apps/api/drizzle.config.ts` | Drizzle ORM configuration |
| `apps/web/next.config.mjs` | Next.js configuration |
| `apps/web/tailwind.config.ts` | TailwindCSS theme and plugins |

### Key Source Files

| File | Purpose | Lines |
|------|---------|-------|
| `apps/api/src/app.ts` | Main Hono server setup | ~100 |
| `apps/api/src/core/queue.ts` | BullMQ queue management | 325 |
| `apps/api/src/db/schema/core.ts` | Main database schema | 215 |
| `apps/web/context/ProjectContext.tsx` | Global project state | 79 |
| `apps/web/lib/api.ts` | Fetch helper | 19 |
| `apps/api/src/middlewares/auth.ts` | JWT authentication | 102 |
| `apps/api/src/core/search/factory.ts` | Multi-LLM provider factory | 86 |

### Environment Files

- `apps/api/.env` - Backend configuration (DB, Redis, JWT, LLM keys)
- `apps/web/.env` - Frontend configuration (API URL)

### Documentation

- `README.md` - Project overview and setup instructions
- `AGENTS.md` - **This file** (technical guide for AI agents)

---

**🎉 End of AGENTS.md**

This document is maintained for AI agents working on mentha-gui. For questions or updates, modify this file directly.
