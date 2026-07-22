# Autocontent Design System

## Color Palette
- **Background**: Deep Navy (#020817) — main page canvas
- **Surface**: Dark Slate (#0f172a) — card backgrounds, sidebar
- **Surface Elevated**: Semi-transparent Dark (#0f172a/40) — glassmorphism cards
- **Primary**: Indigo (#6366f1) — CTA buttons, active states, links
- **Primary Glow**: Indigo (#4f46e5) — hover states, shadows
- **Secondary**: Slate (#1e293b) — secondary surfaces, badges
- **Text Primary**: White (#f8fafc) — headings, primary text
- **Text Secondary**: Slate Gray (#94a3b8) — labels, descriptions
- **Text Muted**: Muted (#64748b) — placeholders, hints
- **Success**: Emerald (#10b981) — published states, positive
- **Warning**: Amber (#f59e0b) — pending approval, caution
- **Error**: Red (#ef4444) — destructive actions, errors
- **Border**: Subtle White (#ffffff/10) — card borders, dividers
- **Accent Gradient**: Indigo to Purple to Pink — hero accents, decorative glows

## Typography
- **Font Family**: Geist Sans (Inter-like modern sans-serif)
- **Heading XL**: 32px, Bold (700), tight tracking
- **Heading LG**: 24px, Bold (700), tight tracking
- **Heading MD**: 18px, Bold (700)
- **Body**: 14px, Regular (400)
- **Body Small**: 13px, Regular (400)
- **Caption**: 12px, Medium (500)
- **Label**: 12px, Medium (500), uppercase optional

## Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 12px
- **lg**: 16px
- **xl**: 24px
- **2xl**: 32px
- **3xl**: 48px

## Border Radius
- **sm**: 8px — small elements (badges, tags)
- **md**: 12px — buttons, inputs
- **lg**: 16px — cards
- **xl**: 20px — large cards, modals
- **full**: 9999px — pills, avatars, circular

## Elevation & Shadows
- **Flat**: No shadow, subtle border only
- **Soft**: 0 4px 30px rgba(0,0,0,0.1) — glassmorphism cards
- **Medium**: 0 8px 30px rgba(0,0,0,0.15) — elevated cards, dropdowns
- **Glow**: Shadow in primary color (shadow-primary/25) — CTA buttons

## Component Tokens
- **Glass Card**: bg rgba(15,23,42,0.4), backdrop-blur(16px), border 1px rgba(255,255,255,0.05)
- **Input**: bg white/5, border white/10, rounded-xl, focus ring primary/50
- **Button Primary**: bg primary, hover primary/90, shadow-lg, rounded-xl
- **Button Ghost**: bg white/5, hover white/10, border white/10, rounded-xl
- **Badge**: bg white/5, text muted, rounded-full, px-3 py-1
- **Icon Container**: rounded-full bg primary/20, text primary

## Layout Patterns
- **Sidebar**: Fixed left, 240px width, glassmorphism background, icon+label nav items
- **Main Content**: Flex-1, overflow-y-auto, p-6
- **Card Grid**: responsive grid with gap-4 or gap-6
- **Stat Cards**: 4-column grid, glass-card, icon + number + label

## Atmosphere
- Dark mode by default, electric high-contrast
- Glassmorphism effects with subtle backdrop blur
- Soft glowing accents (primary, purple, pink) as decorative background elements
- Smooth micro-animations on hover and state changes (framer-motion)
- Professional, premium, tech-forward feel
