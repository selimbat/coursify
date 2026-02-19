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

## Project Structure

```
coursify/
├── docs/
│   ├── prd.md                 # Product requirements
│   └── technical-spec.md      # Technical specifications
├── drizzle.config.ts          # Drizzle ORM config
├── eslint.config.js           # ESLint setup
├── package-lock.json
├── package.json
├── src/
│   ├── app.d.ts               # App typings
│   ├── app.html               # HTML template
│   ├── lib/
│   │   ├── assets/
│   │   │   └── favicon.svg    # App favicon
│   │   ├── index.ts           # Library exports
│   │   └── server/
│   │       └── db/            # Database client + schema
│   │           ├── index.ts
│   │           └── schema.ts
│   ├── routes/                # Roots
├── static/
│   └── robots.txt             # Robots policy
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
├── .env.example               # Environment variables template
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc
└── README.md
```

## Next Steps

See [technical-spec.md](docs/technical-spec.md) for the full development roadmap and upcoming stories.

---

**Version**: 0.1.0  
**Status**: Story 1 - Initializing SvelteKit + PostgreSQL local ✓
