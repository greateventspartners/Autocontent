# Autocontent

**Your brand. Autopiloted.**  
Plateforme SaaS d'automatisation marketing IA — planifie, rédige, génère, programme, publie et optimise du contenu multicanal à partir de votre voix de marque.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| **Frontend** | Next.js 16 (React 19, App Router, Turbopack) |
| **Auth** | Supabase Auth (email/password + Google + Facebook OAuth) |
| **Base de données** | Supabase PostgreSQL (25 tables, RLS) |
| **Stockage fichiers** | Cloudflare R2 (S3-compatible) |
| **IA** | Google Gemini 2.0 Flash (texte + image) |
| **Paiements** | Stripe |
| **Publication** | 7 adaptateurs : WordPress, LinkedIn, Facebook, Instagram, X, TikTok, Medium |
| **Validation** | Zod v4 |
| **Tests** | Vitest |
| **CI/CD** | GitHub Actions → Cloudflare Workers |
| **Package manager** | pnpm 10 |

## Architecture

```
src/
├── app/
│   ├── api/                    # Route handlers (App Router)
│   │   ├── analytics/          # Analytics data & events
│   │   ├── brand-kits/         # Brand kit CRUD + website analysis
│   │   ├── content/            # Content CRUD, generate, schedule, publish, review, images
│   │   ├── campaigns/          # Campaign management
│   │   ├── templates/          # Content prompt templates
│   │   ├── integrations/       # Channel OAuth config
│   │   ├── api-keys/           # API key management
│   │   ├── uploads/            # Media uploads (R2)
│   │   ├── dashboard/          # Dashboard summary
│   │   ├── recommendations/    # AI recommendations
│   │   ├── subscription/       # Stripe billing sessions
│   │   ├── webhooks/stripe     # Stripe webhook handler
│   │   ├── workspace/          # Team member invites
│   │   └── health/             # Health check (DB + R2)
│   ├── (dashboard)/            # Dashboard SPA (6 espaces)
│   ├── sign-in/                # Supabase Auth pages
│   ├── sign-up/
│   └── review/[token]          # Public content review
├── components/
│   ├── dashboard/              # BrandSpace, ContentSpace, PerformanceSpace, etc.
│   ├── PostPreview.tsx         # Platform-specific previews
│   ├── PlatformIcon.tsx        # Channel icons
│   └── providers.tsx           # Supabase Auth context
├── lib/
│   ├── db/                     # Data access layer (Supabase queries)
│   ├── services/               # Typed API client (frontend → routes)
│   ├── publishing/             # Adapter pattern (7 channels)
│   ├── gemini.ts               # Google Gemini SDK client
│   ├── ai.ts                   # AI generation (texte + image)
│   ├── r2.ts                   # Cloudflare R2 storage
│   ├── stripe.ts               # Stripe helpers
│   ├── supabase-*.ts           # Supabase clients (server, client, admin, middleware)
│   ├── errors.ts               # Error classes + handler
│   ├── validation.ts           # Zod schemas
│   ├── rbac.ts                 # Role-based access control
│   ├── rate-limit.ts           # Rate limiting
│   ├── logger.ts               # Structured logger
│   └── api-key-guard.ts        # API key auth guard
├── proxy.ts                    # Auth middleware (Next.js 16)
└── lib/database.types.ts       # Supabase schema types (auto-generated)
```

## Prérequis

- Node.js 22+
- pnpm 10 (`corepack enable pnpm`)
- Un projet Supabase (gratuit)
- Une clé API Google Gemini (optionnelle — mock fallback inclus)
- Un compte Cloudflare (pour R2 + déploiement)
- Des clés Stripe (optionnelles en dev)

## Quick Start

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer l'environnement
cp .env.example .env
# Remplir : Supabase URL + keys, Gemini API key, Stripe keys

# 3. Démarrer le serveur de dev
pnpm dev

# 4. Lancer les tests
pnpm test
```

## Scripts

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Serveur de développement Next.js |
| `pnpm build` | Build Next.js standard |
| `pnpm test` | Tests Vitest |
| `pnpm lint` | ESLint |
| `pnpm cf:build` | Build pour Cloudflare Workers |
| `pnpm cf:preview` | Preview local Wrangler |
| `pnpm cf:deploy` | Build + déploiement Cloudflare |
| `pnpm typegen` | Générer les types Supabase |
| `pnpm cf:typegen` | Générer les types Cloudflare Env |

## Déploiement

Le déploiement se fait via GitHub Actions :

1. Un **push sur `main`** déclenche le workflow `deploy.yml`
2. Le workflow build, puis déploie sur Cloudflare Workers via `wrangler-action`
3. Les secrets sont injectés depuis GitHub Secrets :
   - `CF_API_TOKEN`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`

## Variables d'environnement

Voir `.env.example` pour la liste complète. Variables clés :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role Supabase |
| `GEMINI_API_KEY` | Clé API Google Gemini |
| `S3_ENDPOINT` | Endpoint Cloudflare R2 |
| `S3_BUCKET` | Nom du bucket R2 |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |

## Licence

MIT
