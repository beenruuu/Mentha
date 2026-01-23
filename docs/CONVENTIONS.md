# Mentha - Code Conventions

## General Principles

1. **Clarity over cleverness** - Write code that's easy to understand
2. **Consistent naming** - Follow established patterns
3. **Type safety** - Use TypeScript and Python type hints
4. **Single responsibility** - Keep functions/components focused

---

## Frontend (TypeScript/Next.js)

### File Naming
```
components/          # PascalCase: BrandCard.tsx
hooks/              # camelCase with use-: use-toast.ts
lib/                # kebab-case: api-client.ts
app/                # kebab-case folders: brand/[id]/page.tsx
```

### Component Structure
```tsx
// 1. Imports (sorted: react, external, internal, types)
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useBrand } from '@/hooks/use-brand';
import type { Brand } from '@/types';

// 2. Types (if component-specific)
interface BrandCardProps {
  brand: Brand;
  onSelect?: (id: string) => void;
}

// 3. Component
export function BrandCard({ brand, onSelect }: BrandCardProps) {
  // hooks first
  const [isOpen, setIsOpen] = useState(false);
  
  // handlers
  const handleClick = () => {
    onSelect?.(brand.id);
  };

  // render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Import Aliases
```typescript
import { Button } from '@/components/ui/button';  // ✅
import { Button } from '../../../components/ui/button';  // ❌
```

### Server vs Client Components
```tsx
// Default: Server Component (no directive needed)
export default function Page() { ... }

// Only when needed: Client Component
'use client';
export function InteractiveForm() { ... }
```

---

## Backend (Python/FastAPI)

### File Naming
```
app/
  api/endpoints/    # snake_case: brand_analysis.py
  services/         # snake_case: llm_service.py
  models/           # snake_case: brand_schemas.py
```

### Module Structure
```python
"""
Module docstring explaining purpose.
"""

# 1. Standard library imports
from typing import Optional, List
from datetime import datetime

# 2. Third-party imports
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

# 3. Local imports
from app.core.config import settings
from app.services.llm import LLMService


# 4. Constants
DEFAULT_TIMEOUT = 30


# 5. Classes/Functions
class BrandRequest(BaseModel):
    """Request schema for brand operations."""
    name: str
    domain: str


async def get_brand_analysis(brand_id: str) -> dict:
    """
    Fetch brand analysis results.
    
    Args:
        brand_id: The unique brand identifier
        
    Returns:
        Analysis results dictionary
    """
    pass
```

### API Endpoints
```python
router = APIRouter(prefix="/brands", tags=["brands"])

@router.get("/{brand_id}")
async def get_brand(brand_id: str):
    """Get brand by ID."""
    ...

@router.post("/")
async def create_brand(request: BrandRequest):
    """Create new brand."""
    ...
```

### Type Hints
```python
def process_analysis(
    brand_id: str,
    providers: list[str],
    timeout: int = 30,
) -> dict[str, Any]:
    ...
```

---

## Database (Supabase/SQL)

### Table Naming
```sql
-- Plural, snake_case
CREATE TABLE brands (...);
CREATE TABLE brand_analyses (...);
CREATE TABLE ai_visibility_scores (...);
```

### Column Naming
```sql
-- snake_case
id UUID PRIMARY KEY,
brand_id UUID REFERENCES brands(id),
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP
```

---

## Git Commits

### Format
```
<type>(<scope>): <description>

[optional body]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `style`: Formatting
- `test`: Tests
- `chore`: Maintenance

### Examples
```
feat(analysis): add competitor visibility comparison
fix(api): handle missing AI provider gracefully
docs(readme): add quick start section
refactor(services): extract LLM client interface
```

---

## Error Handling

### Frontend
```typescript
try {
  const data = await api.getBrand(id);
} catch (error) {
  if (error instanceof APIError) {
    toast.error(error.message);
  } else {
    toast.error('An unexpected error occurred');
    console.error(error);
  }
}
```

### Backend
```python
from fastapi import HTTPException

# Use appropriate status codes
raise HTTPException(
    status_code=404,
    detail=f"Brand {brand_id} not found"
)

# For validation errors, let Pydantic handle it
# For server errors, log and raise 500
```
