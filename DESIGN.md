# DynaSec design system

Reference for how the site looks and why. Source of truth is the code; this file explains it.
Last reviewed against the code on 2026-10-21.

## Where the design lives

| File | Role |
|---|---|
| `assets/modern.css` | Design layer for every page: tokens, light/dark themes, components. Wrapped in `@media screen`, so the printable assessment report is untouched. |
| `assets/modern.js` | Progressive enhancement: theme toggle, mobile menu, header "Contact" button, skip link. The site still works without it. |
| `assets/blog.css` | Blog structure and infographics (older base styles; `modern.css` restyles them). |
| Inline `<style>` in `index.html`, `solutions.html`, `assessment.html` | Page-specific layout. Loaded first; `modern.css` loads after and wins ties. |
| `lib/blog-render.js` | Renders blog pages (list, article, shared header/footer for the blog). |

Rule: change colors, type and shared components in `modern.css`. Do not add new hard-coded colors anywhere.

## Principles

1. **Restrained and structured.** Flat surfaces, hairline borders, one brand accent (orange). Typography and spacing carry the design.
2. **Trust over effect.** This is a security consultancy. Nothing decorative that does not help reading or navigation.
3. **Content first.** Layout never changes copy or SEO markup. Prerender markers (`<!--ssr:...-->`) stay intact.
4. **Works in both themes.** Every color goes through a token, never a literal.
5. **Accessible by default.** Visible focus, skip link, readable contrast, reduced-motion support.

Avoid (deliberately removed in v2): gradient headline text, glow and blurred orbs, glassmorphism, pill labels with pulsing dots, glossy gradient buttons with colored shadows, hover lift on every card, scroll-reveal animation, techno copy such as "SIG //".

## Color tokens

Defined on `:root, html[data-theme="dark"]` and overridden by `html[data-theme="light"]`.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#0A111D` | `#F6F8FB` | Page background |
| `--panel` | `#0F1826` | `#FFFFFF` | Cards, inputs |
| `--panel-2` | `#0C1522` | `#EFF3F8` | Diagram, footer, infographic background |
| `--panel-hover` | `#121D2E` | `#F7F9FC` | Hovered card or row |
| `--line` | `#1F2C42` | `#DCE3ED` | Hairline borders and dividers |
| `--line-strong` | `#33476A` | `#B7C3D6` | Input borders, outlined buttons, chips |
| `--text` | `#E7ECF3` | `#1B2638` | Body text |
| `--text-2` | `#C3CFE0` | `#3A4A63` | Secondary text in diagrams |
| `--strong` | `#FFFFFF` | `#0B1424` | Headings, emphasis, active borders |
| `--prose` | `#D3DCE9` | `#2A3850` | Article paragraphs and list items |
| `--muted` | `#92A3BA` | `#566782` | Supporting text |
| `--faint` | `#7385A0` | `#5B6C86` | Footer note |
| `--placeholder` | `#7385A0` | `#5F708A` | Input placeholders |
| `--brand` | `#F26B14` | `#F26B14` | Primary buttons, rules, bullets, progress |
| `--brand-hover` | `#FF7F2E` | `#E0590A` | Hover on brand |
| `--on-brand` | `#0A111D` | `#0A111D` | Text on brand fills |
| `--amber` | `#F7852B` | `#B8480A` | Accent text (labels, numbers, read-more) |
| `--teal` | `#56CFC4` | `#0A7A71` | Links and technical highlights only |
| `--tag-text` | `#A8E2DC` | `#0A6B63` | Tag and chip text |
| `--brand-wash`, `--teal-wash`, `--wash` | tinted | tinted | Subtle selected/hover backgrounds |

`--brand` is sampled from the logo (`#F86808`), slightly softened for UI. White text on orange fails contrast, so brand fills always use `--on-brand` (dark).

### Measured contrast (WCAG 2.x, computed 2026-10-21)

| Pair | Dark | Light |
|---|---|---|
| Body text on background | 15.9 : 1 | 14.3 : 1 |
| Muted on background | 7.4 : 1 | 5.4 : 1 |
| Accent text (`--amber`) on background | 7.5 : 1 | 5.0 : 1 |
| Link (`--teal`) on background | 10.0 : 1 | 4.9 : 1 |
| Button text on brand orange | 6.2 : 1 | 6.2 : 1 |
| Faint on panel-2 | 4.9 : 1 | 4.8 : 1 |

All listed pairs are at or above 4.5 : 1 for normal text. Not measured: text over infographic bar colors, which come from a red to teal scale set inline by the renderer.

## Theming

- Attribute: `html[data-theme="dark" | "light"]`. CSS `color-scheme` follows it, so native controls match.
- First visit follows the system (`prefers-color-scheme`). A visitor's choice is stored in `localStorage` under `dynasec-theme` and used on every page.
- A tiny inline script in each page `<head>` sets the attribute before first paint, so there is no flash. It must stay inline and before the stylesheets (present in `index.html`, `solutions.html`, `assessment.html`, `404.html` and the blog shell in `lib/blog-render.js`).
- `modern.js` handles the toggle, keeps `<meta name="theme-color">` in sync, and updates the button label (Thai or English) with the page language.
- Logo: two `<img>` per placement. `logo-full.png` (light text) for dark, `logo-full-light.png` (dark text) for light, swapped by CSS (`.logo-on-dark` / `.logo-on-light`).
- Code blocks stay dark in both themes. Infographic bar colors are theme-independent.

To add a color: add the token to both theme blocks in `modern.css`, then use `var(--token)`. Never use a hex value in a component rule.

## Typography

One family: **IBM Plex** (Plex Sans Thai covers Thai and matching Latin; Plex Sans; Plex Mono). Loaded from Google Fonts in each page head.

| Role | Style |
|---|---|
| Hero H1 | `clamp(32px, 4.4vw, 54px)`, weight 600, line-height 1.15 (Thai 1.3) |
| Page H1 | `clamp(30px, 4vw, 46px)`, weight 600 |
| Section H2 | `clamp(26px, 3.2vw, 38px)`, weight 600 |
| Article H2 | `clamp(22px, 2.4vw, 27px)`, top rule, 56px above |
| Body | 16px, line-height 1.7; article body 17px / 1.95 |
| Section label | 12.5px, weight 600, uppercase, tracking .14em, `--amber`, with section number |
| Mono | Plex Mono, only for tags, section numbers, index numbers and code |

Thai uses larger line-height and no negative letter-spacing (`html[lang="th"]` rules) so tone marks do not collide.

## Layout and spacing

- Content width `--maxw: 1160px`, side padding 24px (18px on phones).
- Section vertical padding `clamp(56px, 7vw, 92px)`; sections separated by a 1px `--line`.
- Radius `--radius: 6px` everywhere; chips and tags use 4px. No pill shapes.
- Breakpoints in use: 1020px (nav collapses to a menu), 900px, 800px, 760px (footer stacks), 700px (phones).

## Components

- **Header:** solid `--header-bg`, hairline bottom. Links get an animated 2px orange underline on hover and for the current page. Right side: "Contact us" button (desktop), theme toggle, TH/EN switch. Below 1020px the links move into a menu opened by a hamburger button (Escape and link click close it).
- **Section label (eyebrow):** short orange rule on the hero and page heroes. In section heads it becomes a counter (`01 | PROFILE`) driven by a CSS counter.
- **Buttons:** `.btn-primary` solid `--brand` with `--on-brand` text; `.btn-ghost` outlined with `--line-strong`, white border on hover. 6px radius, no shadow, no lift.
- **Cards:** flat `--panel`, 1px `--line`, 6px radius. Hover only brightens the border and background. Light theme adds a very soft shadow.
- **Stat bar (home):** one bordered bar with dividers; each cell has a 26×3px orange rule.
- **Services:** ruled table (cards separated by 1px lines), orange mono index.
- **Tags and chips:** 4px radius, outlined, mono for tags. Active chip is solid brand.
- **Forms:** panel background, `--line-strong` border, brand border and 1px ring on focus.
- **Footer:** logo and one-line description, two-column link list (Thai/English by page language), copyright note.
- **Blog list:** search box, top 10 tags plus "more", first card featured (full width with orange left border), 12 cards per page with "show more". All cards stay in the HTML for crawlers.
- **Article:** 740px column, H2 with top rule, square orange bullets, teal underlined links, dark code blocks.
- **Infographics:** bordered box with orange top edge. Types: steps, flow, hub, spectrum, columns (see `admin/config.yml` for fields). Hubs with more than five items wrap to two rows.

## States and motion

- Focus: 2px `--brand` outline with 3px offset on all interactive elements; selected form options use the same color.
- Hover: color or border change only, 150ms.
- No entrance animations, parallax or looping motion. `prefers-reduced-motion` disables remaining transitions.

## Accessibility checklist (current)

- Skip link ("Skip to content" / "ข้ามไปยังเนื้อหา") added by `modern.js`.
- Menu button has `aria-label` and `aria-expanded`; theme button has a Thai/English `aria-label` and title.
- Heading order: one H1 per page; checked on the blog templates.
- Contrast: see table above.
- Language: `html[lang]` is kept in sync by each page's language switch, which also drives the Thai/English labels added by this layer.

## Known gaps

- The diagram on the home page scrolls horizontally on phones because its labels are too small if scaled down.
- Page inline CSS still duplicates some rules across `index.html`, `solutions.html` and `assessment.html`; `modern.css` overrides them rather than replacing them. A full consolidation would reduce risk of drift.
- Light theme was reviewed on the home page, blog list, article, assessment start page and mobile home. Not yet reviewed: solutions page, assessment results screen, English pages, 404.
- Browser coverage reviewed: Chrome only. The link underline color uses `color-mix()`, which needs a recent browser; older ones fall back to no underline color.
- The Google Fonts requests add a third-party dependency and a small privacy cost; self-hosting the three families would remove it.

## Changing the design safely

1. Change tokens first; most visual changes need nothing else.
2. Check both themes and a 390px-wide viewport.
3. Keep prerender markers and `data-i18n` attributes untouched.
4. After editing `lib/blog-render.js`, render a post and the list and check that no raw markup or broken links appear.
