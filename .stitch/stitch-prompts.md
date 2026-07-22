# Autocontent — Stitch Prompts

Copy-paste these into https://stitch.withgoogle.com to generate high-fidelity screens.

---

## 1. Login Page (`/`)

A premium dark-themed login page for "Autocontent", an AI-powered multi-channel content publishing SaaS. Electric, high-contrast accents on deep navy backgrounds with glassmorphism effects.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, professional, tech-forward
- Background: Deep Navy (#020817) with subtle radial gradient glows (indigo, purple, pink)
- Surface: Dark Slate (#0f172a) glassmorphism cards with backdrop-blur
- Primary Accent: Indigo (#6366f1) for CTA and active states
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)
- Border: Subtle white at 10% opacity
- Buttons: Pill-shaped (12px radius), glow shadow in primary color
- Inputs: Semi-transparent dark with subtle borders, focus ring in primary

**Page Structure:**
1. **Split Layout**: Left 50% — atmospheric hero image with dark gradient overlay and glowing abstract shapes. Right 50% — login form.
2. **Hero Panel (Left)**: Full-height background image (team collaboration photo) with dark gradient overlay. Centered "A" logo mark in gradient circle (indigo to purple). Brand name "Autocontent" in bold 36px. Tagline: "Créez, planifiez et publiez votre contenu sur tous vos réseaux sociaux grâce à l'IA." Three stat badges at bottom: "124 Posts/mois", "8 Canaux", "5s Génération".
3. **Login Form (Right)**: Centered vertically. "Bon retour !" heading. "Connectez-vous à votre espace de travail." subtext. Google OAuth button with Google logo icon. Divider line "ou par email". Email input with mail icon. Password input with lock icon and show/hide toggle. "Mot de passe oublié ?" link. Primary CTA "Se connecter" with arrow icon. "Pas encore de compte ? Créer un compte gratuitement" link at bottom.
4. **Form Styling**: Inputs have dark semi-transparent backgrounds (white/5), subtle white/10 borders, rounded-xl (12px), left icon placement. Focus states use primary ring.

---
💡 **Tip:** Create matching Register and Onboarding screens to ensure a consistent auth flow.

---

## 2. Register Page (`/register`)

A premium dark-themed registration page for "Autocontent", matching the login page style. Split layout with atmospheric hero and clean form.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, professional, tech-forward (identical to Login)
- Background: Deep Navy (#020817) with radial gradient glows
- Surface: Dark Slate (#0f172a) glassmorphism
- Primary Accent: Indigo (#6366f1)
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)
- Border: Subtle white at 10%
- Buttons: Pill-shaped, glow shadow

**Page Structure:**
1. **Split Layout**: Left 50% — same atmospheric hero as Login. Right 50% — registration form.
2. **Hero Panel (Left)**: Identical to login hero (reuse). Same logo, brand name, tagline, and stat badges.
3. **Register Form (Right)**: "Créer un compte" heading. "Commencez à piloter vos contenus avec l'IA." subtext. Google OAuth button. Divider "ou par email". Full name input with user icon. Email input with mail icon. Password input with lock icon and show/hide toggle (min 8 chars). Primary CTA "Créer mon compte" with arrow icon. "Déjà un compte ? Se connecter" link at bottom.
4. **Form Styling**: Same as login — dark inputs, left icons, rounded-xl, primary focus ring.

---
💡 **Tip:** These two auth screens should feel like mirror images — same hero, swapped form content.

---

## 3. Onboarding Wizard (`/onboarding`)

A 3-step onboarding wizard for Autocontent with a clean, spacious dark interface. The user configures their Brand Kit, generates Bios, and completes setup.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, spacious, guided
- Background: Deep Navy (#020817)
- Surface: Dark Slate (#0f172a) glassmorphism cards
- Primary Accent: Indigo (#6366f1) for active steps and CTAs
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)
- Border: Subtle white at 10%
- Step Indicator: Pill-shaped badges with icon + label, primary highlight for active

**Page Structure:**
1. **Fixed Header**: Logo mark (gradient circle with "A") + "Configuration de votre espace" heading. Clean, minimal.
2. **Step Indicators**: Horizontal row of 3 pill-shaped step badges: "Brand Kit" (palette icon), "Bios" (pen icon), "Terminer" (rocket icon). Active step highlighted in primary. Completed steps show primary with check. Connected by thin lines.
3. **Step 0 — Brand Kit (Scrollable)**: Multiple glassmorphism cards stacked vertically:
   - **Website Import Card**: Wand icon + "Import depuis un site web". URL input with search icon. "Analyser" button.
   - **Brand Name Card**: Text input "Mon Entreprise" placeholder.
   - **Logo Card**: Upload area — dashed border square with upload icon. Shows uploaded logo preview.
   - **Colors Card**: Grid of 4 color circles with editable names. Plus button to add more. Each circle is 48px with ring border.
   - **Platforms Card**: Globe icon + "Plateformes de publication". 2x4 grid of platform toggle buttons (LinkedIn, X, Instagram, Facebook, TikTok, Pinterest, WordPress, Medium). Selected = primary border + checkmark.
   - **Tone Card**: "Ton Éditorial" heading. 2x2 grid of tone options (Corporate, Friendly, Humoristique, Technique). Textarea for Do's & Don'ts. Input for keywords. Voice samples section with add/remove.
4. **Step 1 — Bios**: "Bios & Profils" heading. "Générer mes bios" button with sparkle icon. Grid of platform cards showing generated bio variants. Loading spinner during generation.
5. **Step 2 — Summary**: Centered rocket icon in primary circle. "Tout est prêt !" heading. Summary card showing: brand name + colors + tone, platforms count, bios count. Primary CTA "Commencer".
6. **Fixed Footer**: "Retour" button (ghost) on left. "Suivant" button (primary) on right. Step 2 shows "Commencer" (primary) instead.

---
💡 **Tip:** The scrollable content area is critical — it must scroll independently while header/footer stay fixed.

---

## 4. Dashboard (`/dashboard`)

The main dashboard of Autocontent showing content analytics, recent activity, and platform distribution. Dark, data-rich, premium feel.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, data-rich, professional
- Background: Deep Navy (#020817)
- Surface: Dark Slate (#0f172a) glassmorphism cards
- Primary Accent: Indigo (#6366f1)
- Success: Emerald (#10b981) for published
- Warning: Amber (#f59e0b) for pending
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)
- Border: Subtle white at 10%
- Chart Colors: Indigo, Emerald, Amber, Rose, Sky

**Page Structure:**
1. **Sidebar (Fixed Left, 240px)**: Glassmorphism background. Logo mark at top. Navigation items with icon + label: Dashboard (active), Copilot, Calendar, Campaigns, Ideas, Approvals, Bio, Brand Kit, Settings. Active item has primary background tint. Workspace selector at bottom with user avatar.
2. **Main Content Area**: "Dashboard" heading + "Vue d'ensemble de votre activité" subtext.
3. **Stats Row**: 4-column grid of glass cards:
   - Publications ce mois (TrendingUp icon, primary) — "147"
   - En attente (Clock icon, amber) — "12"
   - Total contenus (FileText icon, primary) — "234"
   - Total publications (CheckCircle2 icon, emerald) — "1,892"
4. **Charts Row**: 2-column grid:
   - **Bar Chart**: "Publications par plateforme" — vertical bars per platform (LinkedIn, Instagram, Facebook, Twitter)
   - **Pie Chart**: "Répartition des statuts" — donut chart with Published (emerald), Scheduled (blue), Pending (amber), Draft (gray)
5. **Activity Feed**: "Activité récente" heading. Vertical list of activity items with: status icon (colored by status), title, platform badge (colored pill), timestamp. Alternating subtle backgrounds.

---
💡 **Tip:** Charts should use the Recharts library style — clean, minimal, with tooltip on hover.

---

## 5. Copilot — AI Content Generator (`/copilot`)

The AI content generation interface. Multi-tab platform selector with prompt input and generated content preview. Chat-like interface.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, conversational, AI-powered
- Background: Deep Navy (#020817)
- Surface: Dark Slate (#0f172a) glassmorphism
- Primary Accent: Indigo (#6366f1)
- Platform Colors: LinkedIn (blue-600), Twitter (sky-500), Instagram (pink-to-orange gradient), Facebook (blue-800), TikTok (black), Pinterest (red-600), WordPress (slate-700), Medium (stone-800)
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)

**Page Structure:**
1. **Sidebar**: Same as Dashboard (consistent navigation).
2. **Platform Tabs**: Horizontal row of platform pill-tabs with icon + label. Active tab highlighted with platform color. Each tab shows the platform icon (Share2 for LinkedIn, MessageCircle for Twitter, Camera for Instagram, etc.).
3. **Chat/Generation Area**:
   - **Welcome State**: Sparkle icon centered. "Bonjour ! Je suis votre Copilot IA." message. "Choisissez une plateforme et décrivez le contenu que vous souhaitez créer." Suggestion chips: "Post LinkedIn engagement", "Thread Twitter", "Post Instagram carousel".
   - **Input Area**: Bottom-fixed. Textarea with placeholder "Décrivez le contenu que vous souhaitez créer...". Platform selector dropdown. "Générer" primary button with sparkle icon.
   - **Generated Content**: Glass card with generated text. Platform-colored header bar. Copy button, edit button, publish button. Content in clean typography. Metadata: word count, estimated read time.
4. **Content Actions**: After generation — "Publier" (primary), "Programmer" (secondary), "Modifier" (ghost) buttons. Platform composer link.

---
💡 **Tip:** The chat-like flow should feel natural — messages appear with smooth slide-in animations.

---

## 6. Calendar (`/calendar`)

A monthly calendar view for content scheduling. Dark theme with platform-colored event dots.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, organized, visual
- Background: Deep Navy (#020817)
- Surface: Dark Slate (#0f172a) glassmorphism
- Primary Accent: Indigo (#6366f1)
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)
- Border: Subtle white at 10%
- Platform Colors: Same as Copilot (LinkedIn blue, Instagram gradient, etc.)

**Page Structure:**
1. **Sidebar**: Same navigation as Dashboard/Copilot.
2. **Calendar Header**: Month/Year title. Navigation arrows (left/right). "Aujourd'hui" button. View toggle (list/grid). Filter by platform dropdown. "Nouveau post" primary button with plus icon.
3. **Calendar Grid**: 7-column grid (Mon-Sun). Day cells with:
   - Day number (top-left, muted text for non-current month)
   - Today highlighted with primary ring
   - Platform-colored dots/pills for scheduled posts (small colored circles or mini badges)
   - Hover state: subtle background lift
4. **Day Detail Panel** (when clicking a day): Slide-in panel from right showing:
   - Date heading
   - List of posts scheduled for that day
   - Each post: platform badge, title, time, status badge
   - "Ajouter un post" button
5. **Empty State**: When no posts — calendar icon, "Aucun contenu planifié" message, "Créer votre premier post" CTA.

---
💡 **Tip:** Platform dots on calendar cells should be small (8px) and colored by platform for quick visual scanning.

---

## 7. Brand Kit (`/brand-kit`)

Brand identity management page. Edit colors, tone, keywords, and voice samples.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Dark mode, visual, brand-focused
- Background: Deep Navy (#020817)
- Surface: Dark Slate (#0f172a) glassmorphism cards
- Primary Accent: Indigo (#6366f1)
- Text Primary: White (#f8fafc)
- Text Secondary: Slate Gray (#94a3b8)

**Page Structure:**
1. **Sidebar**: Same navigation.
2. **Page Header**: "Brand Kit" heading. "Identité de marque" subtext. "Analyser un site" button (wand icon) on right.
3. **Website Analysis Card**: Search input with URL. "Analyser" button. Loading state with spinner.
4. **Logo Section**: Upload area or current logo preview with "Retirer" option.
5. **Colors Section**: "Couleurs de marque" heading. Grid of color circles (48px) with editable hex and name. Add/remove buttons. Color picker on click.
6. **Tone Section**: "Ton éditorial" heading. 4-option grid (Corporate, Friendly, Humoristique, Technique). Active = primary border.
7. **Instructions Section**: "Do's & Don'ts" textarea. "Mots-clés" input.
8. **Voice Samples Section**: "Exemples de voix" heading. List of added samples with remove button. Textarea + "Ajouter" button.
9. **Save Button**: Fixed bottom "Sauvegarder" primary button.

---
