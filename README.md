# Coursify

Shared shopping list application for couples. Manage grocery lists together with offline support and simple Markdown-based editing.

## Overview

- **Tech Stack**: SvelteKit (full-stack) + PostgreSQL
- **Design**: Mobile-first PWA
- **Auth**: Shared passphrase (minimal auth)
- **Data Format**: Markdown

## Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 12+ (local installation or Docker)

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
cd coursify
npm install
```

### 2. Set Up PostgreSQL

#### Option A: Local PostgreSQL Installation

Make sure PostgreSQL is installed and running on your system.

```bash
# On macOS with Homebrew
brew install postgresql
brew services start postgresql

# On Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Option B: Docker

```bash
docker run --name coursify-db \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=coursify \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configure Database Connection

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your PostgreSQL credentials:

```
DATABASE_URL=postgres://user:password@localhost:5432/coursify
```

### 4. Run Database Migrations

```bash
npm run db:setup
```

This creates the `lists` and `settings` tables with the initial schema.

## Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Check Database Connection

Once running, the home page will display the database connection status. The `/api/health` endpoint can be used to verify the connection:

```bash
curl http://localhost:5173/api/health
```

Expected response:
```json
{
  "message": "Database connection successful",
  "time": "2026-02-04T10:30:00.000Z"
}
```

## Production Build

```bash
npm run build
npm run preview
```

## Project Structure

```
coursify/
├── src/
│   ├── lib/
│   │   └── db.ts          # PostgreSQL connection pool
│   ├── routes/
│   │   ├── +page.svelte   # Home page (connection status)
│   │   └── api/
│   │       └── health/    # Health check endpoint
│   └── types/             # TypeScript type definitions
├── migrations/
│   └── 001_initial_schema.sql  # Database schema
├── scripts/
│   └── migrate.js         # Migration runner
├── docs/
│   ├── prd.md            # Product requirements
│   └── technical-spec.md # Technical specifications
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .env.local.example    # Environment variables template
```

## Database Schema

### Tables

**lists**
- `id` (UUID): Unique identifier
- `title` (string): List title
- `status` (enum): 'en_cours' | 'en_attente' | 'faite'
- `markdown` (text): List content in Markdown format
- `is_template` (boolean): Whether this is the template list
- `created_at` (timestamp): Creation date (null for template)
- `updated_at` (timestamp): Last modification date
- `last_modified_by` (enum): 'user_a' | 'user_b'

**settings**
- `id` (serial): Identifier
- `shared_passphrase_hash` (text): Hashed passphrase for authentication
- `created_at` (timestamp): Creation date
- `updated_at` (timestamp): Last update date

## Acceptance Criteria (Story 1)

✓ Un projet SvelteKit monolithique démarre en local.  
✓ La base PostgreSQL locale est joignable depuis l'app.  
✓ Un guide README couvre installation et démarrage.

## Troubleshooting

### "Connection refused" on localhost:5432

- Ensure PostgreSQL is running: `pg_isready` (returns `accepting connections`)
- Check credentials in `.env.local`
- For Docker, ensure the container is running: `docker ps`

### Migration errors

- Verify the database exists: `psql -U user -d coursify -c "\dt"`
- Re-run migrations: `npm run db:setup`
- Check PostgreSQL logs for detailed errors

## Next Steps

See [technical-spec.md](docs/technical-spec.md) for the full development roadmap and upcoming stories.

---

**Version**: 0.1.0  
**Status**: Story 1 - Initializing SvelteKit + PostgreSQL local ✓
