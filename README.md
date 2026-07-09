# Autocontent

Plateforme SaaS de marketing de contenu multi-canal assistée par l'IA. Créez, planifiez et publiez du contenu sur tous vos réseaux sociaux, avec une identité de marque centralisée (Brand Kit).

- **Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Prisma + PostgreSQL (Neon) · Google Gemini · Cloudflare Workers (open-next).
- **Auth** : email/mot de passe (JWT en cookie httpOnly) + connexion OAuth LinkedIn.
- **Multi-tenant** : workspaces, membres (OWNER/EDITOR/CLIENT), invitations.

## Démarrage en local

```bash
npm install
cp .env.example .env        # renseignez DATABASE_URL, GEMINI_API_KEY, JWT_SECRET, LinkedIn
npx prisma migrate dev
npm run dev
```

## Déploiement sur Cloudflare (via GitHub)

1. Créez le repo GitHub et poussez la branche `main`.
2. Dans le dashboard Cloudflare, générez un **API Token** (Workers: Edit) et récupérez votre **Account ID**.
3. Dans *Settings → Secrets and variables → Actions* du repo GitHub, ajoutez :
   - `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - `DATABASE_URL` (pooled Neon, ex. `postgresql://...@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require`)
   - `GEMINI_API_KEY`, `JWT_SECRET`
   - `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI` (pointe vers `https://<votre-worker>/api/auth/linkedin/callback`)
4. Pour les secrets lus au runtime par le Worker, configurez-les aussi côté Cloudflare :
   ```bash
   wrangler secret put DATABASE_URL
   wrangler secret put GEMINI_API_KEY
   wrangler secret put JWT_SECRET
   wrangler secret put LINKEDIN_CLIENT_ID
   wrangler secret put LINKEDIN_CLIENT_SECRET
   wrangler secret put LINKEDIN_REDIRECT_URI
   ```
5. Chaque push sur `main` déclenche `.github/workflows/deploy.yml` (build open-next + `wrangler deploy`).

> Note Prisma/Neon sur Workers : utilisez impérativement le **connection string poolé** (`-pooler`) de Neon pour la compatibilité WebSocket du driver serverless.

### Prévisualisation en local (Windows)

`npx opennextjs-cloudflare build` crée des symlinks pour `node_modules` (notamment `@prisma/client`). Sous Windows, cela échoue avec `EPERM` sans les droits administrateur ou le **Mode Développeur** activé (`Paramètres → Pour les développeurs`). Le déploiement via GitHub Actions (Linux) n'est pas affecté. Pour tester en local sur Windows : activez le Mode Développeur, ou lancez le terminal en administrateur.

## Structure

```
src/app/(auth)        Pages de connexion / inscription
src/app/(dashboard)   Dashboard, Copilot IA, Calendrier, Brand Kit, Approbations, Paramètres
src/app/api           Routes API (auth, brand-kit, contents, posts, campaigns, workspaces, copilot)
src/lib               auth (JWT), prisma, gemini, linkedin
prisma                Schéma + migrations
```
