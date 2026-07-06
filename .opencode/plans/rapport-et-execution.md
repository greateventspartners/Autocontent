# Rapport & Plan d'Exécution — Autocontent (Autopilot)

## Rapport du Projet

**Stack :** Next.js 16.2.9 + React 19.2.4 + Prisma 7.8.0 + Tailwind v4 + TypeScript 5  
**Cible :** Cloudflare Workers (via OpenNext)  
**Base de données :** SQLite (dev) / Neon PostgreSQL (cible prod)  
**IA :** Google Gemini 2.0 Flash  
**Auth :** JWT (jose) + bcryptjs + cookies httpOnly  

### Constats clés

| Aspect | Statut |
|--------|--------|
| DB | SQLite en dev, aucune migration Prisma (`prisma/migrations/` vide) |
| Cloudflare | Wrangler config OK, `cloudflare-env.d.ts` maintenant généré |
| Liens | URLs en texte brut — aucun composant ne les rend cliquables |
| Preview | Copilot a un aperçu WYSiWYG basique, pas de preview liée à la nav |
| Auth | JWT secret hardcodé en fallback, pas de middleware de protection |
| OAuth | Boutons Google/Meta présents mais non fonctionnels |
| Secret | `GEMINI_API_KEY` commitée dans `.env` (fuite) |

---

## Plan d'Exécution (30 actions, 6 phases)

### Phase 1 — Fondations critiques

1. ✅ **Générer les types Cloudflare** — `npx wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts` *(fait)*
2. **Migrer le schema Prisma vers PostgreSQL**
   - Changer `provider = "sqlite"` → `provider = "postgresql"` dans `prisma/schema.prisma`
   - Ajouter `directUrl = env("DIRECT_DATABASE_URL")`
   - Créer la migration initiale : `npx prisma migrate dev --name init`
3. **Nettoyer GEMINI_API_KEY du `.env`** et utiliser `process.env.GEMINI_API_KEY` avec fallback
4. **Remplacer le fallback JWT_SECRET** — supprimer la valeur hardcodée, exiger `process.env.JWT_SECRET`

### Phase 2 — Base de données Cloudflare (Neon PostgreSQL)

5. Créer un projet Neon PostgreSQL → récupérer l'URL de connexion
6. Mettre à jour `.env` :
   - `DATABASE_URL="postgresql://..."` (Neon direct)
   - `DIRECT_DATABASE_URL="postgresql://..."` (Neon direct avec pooling si besoin)
7. Exécuter `npx prisma migrate dev --name init` pour générer les migrations
8. Ajouter `DATABASE_URL` et `DIRECT_DATABASE_URL` au dashboard Cloudflare
9. Tester `npm run build` (OpenNext build)

### Phase 3 — Liens cliquables

10. Créer `src/components/Linkify.tsx` — composant qui :
    - Détecte les URLs via regex `/(https?:\/\/[^\s<]+)/g`
    - Rendu en `<a href="..." target="_blank" rel="noopener noreferrer">`
    - Style: `text-primary underline`
11. Intégrer Linkify dans `copilot/page.tsx` (preview area)
12. Intégrer Linkify dans `approvals/page.tsx` (contenu des posts)
13. Intégrer Linkify dans `dashboard/page.tsx` (activité récente)

### Phase 4 — Preview fonctionnelle dans la navigation

14. Ajouter un item "Aperçu" dans la sidebar (`Sidebar.tsx`)
15. Créer `src/app/(dashboard)/preview/page.tsx` — page de preview multi-plateforme
16. Ajouter des boutons "Aperçu" contextuels dans `approvals/page.tsx` et `calendar/page.tsx`

### Phase 5 — Améliorations & bonnes pratiques

17. Créer `src/middleware.ts` pour protéger les routes `/dashboard/*`
18. Installer Zod : `npm install zod`
19. Valider les entrées API avec Zod
20. Ajouter `image-domains: ["images.unsplash.com"]` dans `next.config.ts`
21. Créer `src/app/not-found.tsx` (page 404)
22. Créer `src/app/(dashboard)/loading.tsx` (skeleton loading)

### Phase 6 — Déploiement Cloudflare

23. `npm run build` (vérifier OpenNext)
24. Configurer les secrets : `npx wrangler secret put DATABASE_URL`, etc.
25. `npm run deploy`
26. Configurer domaine personnalisé + SSL

---

## Prérequis pour exécuter

- **Neon PostgreSQL** : créer un compte sur [neon.tech](https://neon.tech), créer un projet, copier la connection string
- **Permissions** : ce plan nécessite des modifications de fichiers (read/write)
