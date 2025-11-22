# Supabase Database Migrations

This directory contains database migrations for the Supabase project. Migrations help track changes to your database schema over time in a version-controlled way.

## Directory Structure

- `migrations/`: Contains SQL migration files in the format `YYYYMMDDHHMMSS_description.sql`
- `seed.sql`: Contains seed data for development and testing

## Remote-Only Workflow

This project is configured to work directly with your remote Supabase instance without requiring a local database. This makes it easier to manage database schema changes in a production environment.

## Getting Started

### Installing Supabase CLI

Before using the migration commands, ensure you have the Supabase CLI installed:

```bash
# macOS with Homebrew
brew install supabase/tap/supabase

# Other platforms
# See https://supabase.com/docs/guides/cli for installation instructions
```

### Link to Your Supabase Project

Before you can use the migration commands, you need to link to your remote Supabase project:

```bash
# Login to Supabase
supabase login

# Link to your project (will prompt you to select a project)
supabase link
```

## Migration Commands

### Create a New Migration

To create a new migration file:

```bash
make db-migration-new name=create_new_table
```

This creates a new timestamped SQL file in the `migrations/` directory. Edit this file to add your SQL statements.

### Example Migration File

Here's an example of what a migration file might look like:

```sql
-- Create a new table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
CREATE POLICY "Allow public read access"
  ON public.products
  FOR SELECT
  USING (true);
```

### Apply Migrations to Remote Database

To apply your migrations to the remote database:

```bash
make db-apply
```

or

```bash
make db-push
```

Both commands do the same thing - they push all pending migrations to your linked Supabase project.

### List Applied Migrations

To see which migrations have already been applied to your remote database:

```bash
make db-list
```

This will show a table with LOCAL and REMOTE columns, indicating which migrations exist locally and which have been applied to the remote database.

### Check Migration Status

To see a complete status of your migrations:

```bash
make db-status
```

This command shows:
1. The migration status table (same as `db-list`)
2. A list of all migration files in your project

This is useful for identifying any discrepancies between your local files and what's been applied to the remote database.

## Best Practices

1. **Test migrations carefully**: Since you're applying directly to production, be extra cautious with your SQL
2. **Create backups**: Consider taking a database backup before applying major migrations
3. **Make small, incremental changes**: Smaller migrations are easier to understand and less risky
4. **Add comments**: Document what each migration does and why
5. **Use transactions**: Wrap complex migrations in transactions so they can be rolled back if something fails
6. **Add down migrations when possible**: Although rarely used in production, it's good practice to document how to revert changes
7. **Test on a staging project first**: For critical changes, test on a Supabase staging project before applying to production

## Common Tasks

### Adding a New Table

```sql
CREATE TABLE public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Set up security
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
```

### Adding a Column

```sql
ALTER TABLE public.existing_table ADD COLUMN new_column TEXT;
```

### Creating an Index

```sql
CREATE INDEX idx_existing_table_column ON public.existing_table (column_name);
```

### Setting Up RLS Policies

```sql
-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON public.user_data
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON public.user_data
  FOR UPDATE
  USING (auth.uid() = user_id);
```

For more information, see the [Supabase Database Migrations documentation](https://supabase.com/docs/guides/database/migrations).