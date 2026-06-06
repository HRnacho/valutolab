# Handoff: ValutoLab Design System v2 — Premium Consulting × Tech

## Overview

This handoff covers the **redesign of ValutoLab** — a soft-skills assessment platform mapped on the European ESCO v1.2 framework. The goal of the redesign is to lift the visual perception of the product from "landing template" to **professional assessment tool**, in line with what the product already does technically (12 ESCO competencies, weighted Likert + SJT blend, AI-generated qualitative reports).

The redesign covers:
- A **new design system** (typography, color, components, voice) — v2 is the approved direction
- A **new logotype** (two-block construction)
- A **fix for the misaligned PDF reports** (pipeline migration, see `PDF_PIPELINE.md`)

The system is meant to be the foundation for three deliverables, in order of priority:
1. **PDF report** (5–8 pages) — the client-facing deliverable; highest impact on brand credibility
2. **Marketing site** (`www.valutolab.com`) — currently looks like a template
3. **Internal app** (user dashboard, assessment flow, HR organization dashboard)

---

## About the design files

The files in `references/` are **design references created in HTML** — prototypes that show the intended look, type, palette, and components. They are **not production code to copy directly**.

The task for Claude Code is to **implement this design system inside the existing codebase** — `HRnacho/valutolab`, which is **Next.js 14 + Tailwind CSS + TypeScript**, using the patterns and libraries already in place (`recharts` for charts, `lucide-react` for icons).

## Fidelity

**High-fidelity (hifi).** Colors, typography scale, spacing, components are final. Recreate pixel-perfectly using the codebase's Tailwind setup. Where this README gives exact hex values, font-sizes, weights, letter-spacing — use those values verbatim.

---

## Codebase context (target stack)

Confirmed from the repo:

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS 3.3 (already configured)
- **Icons**: `lucide-react` ✅ (already installed — use this everywhere)
- **Charts**: `recharts` ✅ (use this for the competence chart)
- **Backend**: Express + Supabase (Postgres)
- **AI reports**: `@anthropic-ai/sdk` — Claude Sonnet 4 generates structured JSON
- **PDF generation today**: `jspdf` + `html2canvas` (client-side raster) — **this is the cause of the alignment issues. See `PDF_PIPELINE.md` for the migration plan.**

Files in the repo that this redesign will affect (non-exhaustive):
- `frontend/app/page.tsx` — homepage
- `frontend/app/admin/dashboard/page.tsx` — HR/admin dashboard (74KB — needs refactor)
- `frontend/components/BadgeGenerator.tsx` — LinkedIn badge
- `frontend/components/QR*.tsx` — QR code on report
- `frontend/components/Footer.tsx`
- All future report pages (currently the report rendering and PDF export logic lives client-side)
- `backend/services/ai-report-generator.js` — AI prompts (no UI changes needed; the JSON output structure is already perfect for the new design)

---

## Design tokens

These tokens go into `tailwind.config.ts` and `globals.css`. See `tokens/` for ready-to-paste snippets.

### Typography

Three Google Font families (free, no licensing cost):

| Family | Role | Use for |
| --- | --- | --- |
| **Space Grotesk** | Display | Headings, wordmark, hero numbers, section titles |
| **IBM Plex Sans** | Body | Paragraphs, UI labels, button text, form fields |
| **JetBrains Mono** | Mono | Eyebrows, data values, ESCO URIs, code, timestamps |

#### Type scale (final)

| Token | Family | Size / Line | Weight | Letter-spacing | Use |
| --- | --- | --- | --- | --- | --- |
| `display-1` | Space Grotesk | 64 / 66 | 700 | −0.030em | Hero headings |
| `display-2` | Space Grotesk | 42 / 46 | 500 | −0.025em | Section titles |
| `display-3` | Space Grotesk | 28 / 32 | 500 | −0.015em | Subsection / large card titles |
| `lede` | Space Grotesk | 22 / 31 | 300 italic | normal | Pull-quotes, AI personalized readings |
| `body` | IBM Plex Sans | 16 / 26 | 400 | normal | Body text |
| `caption` | IBM Plex Sans | 13 / 20 | 400 | normal | Source notes, meta |
| `eyebrow` | JetBrains Mono | 12 | 500 | 0.18em uppercase | Section markers (§ 01 etc.) |
| `mono` | JetBrains Mono | 14 | 400 | normal | URIs, data, timestamps |
| `numeric` | Space Grotesk | 90 | 300 | −0.040em, tabular-nums | Score numbers |

### Colors

Four families. **Do not introduce additional colors beyond these.**

#### Ink (primary text + dark surfaces)
```
ink-950: #07111E
ink-900: #0E1A2B   ← main text on light, main dark surface
ink-800: #1B2A40
ink-700: #2E3F58
ink-600: #4E5E78
ink-500: #6F7E96
ink-400: #94A0B5
ink-300: #BCC4D2
ink-200: #D9DEE7
ink-100: #EAEDF2
ink-50:  #F2F4F7
```

#### Paper (warm off-white backgrounds — NOT cold gray)
```
paper-50:  #FBF8F2   ← lightest, main report bg
paper-100: #F6F2EA   ← main app bg
paper-200: #ECE6D8   ← section dividers
paper-300: #D9D0BC   ← borders on paper surfaces
```

#### Sienna (single accent — use sparingly: brand, key data, primary CTA, links)
```
sienna-700: #8B3D1F   ← link hover, dark accent
sienna-600: #B85C3A   ← primary accent (brand, CTA)
sienna-500: #CF7556
sienna-300: #E9B89E
sienna-100: #F7E6D9
sienna-50:  #FCF3EA
```

#### Levels (functional — ONLY for ESCO scoring on the 4-level scale)
```
level-base:       #B0473A   ← score 1.0–2.0
level-intermedio: #C68A2E   ← score 2.1–3.0
level-avanzato:   #4F7A53   ← score 3.1–4.0
level-esperto:    #2D5F73   ← score 4.1–5.0
```
**Strict rule**: never use level colors outside of scoring context.

### Spacing & elevation

| Token | Value | Use |
| --- | --- | --- |
| `radius-sm` | 2px | Buttons, pills, default UI |
| `radius-md` | 4px | Cards |
| `radius-lg` | 6px | Modals |
| `shadow-sm` | `0 1px 2px rgba(14,26,43,0.06)` | Subtle elevation |
| `shadow-md` | `0 4px 14px rgba(14,26,43,0.08)` | Cards, dropdowns |
| `shadow-lg` | `0 22px 60px rgba(14,26,43,0.14)` | Modals, hero surfaces |

**Rule**: corners are mostly square or `radius-sm` (2px). No rounded pill buttons, no `radius-xl`. The system reads premium because of restraint.

---

## Logotype

A two-block wordmark: **"Valuto" on Ink + "Lab" on Sienna**, no rounded corners, tight letter-spacing.

### Construction
```html
<span class="wordmark">
  <span class="wordmark__blk wordmark__blk--ink">Valuto</span>
  <span class="wordmark__blk wordmark__blk--sienna">Lab</span>
</span>
```

### CSS
```css
.wordmark {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.045em;
  display: inline-flex;
  gap: 0;
}
.wordmark__blk {
  /* padding ratio: ~20% horizontal, ~15% bottom — scales with font-size */
  padding: 0.20em 0.24em 0.15em;
  display: inline-block;
}
.wordmark__blk--ink    { background: #0E1A2B; color: #FBF8F2; }
.wordmark__blk--sienna { background: #B85C3A; color: #FBF8F2; }
```

### Variants
- **Primary**: Ink + Sienna (default everywhere)
- **Editorial on dark surfaces**: Paper-50 + Sienna (when sitting on Ink background)
- **Reversed on Sienna surfaces**: Ink + Paper-outline (when sitting on Sienna background)

### Sizing
| Context | font-size |
| --- | --- |
| Favicon | 16–24px |
| Nav bar / dashboard header | 22–28px |
| Report cover | 84–96px |
| Section masthead | 46–58px |

### Replace
Wherever the current site uses the bare "ValutoLab" text mark with the purple gradient, replace with this two-block construction.

---

## Voice & tone

Two registers coexist:

| When | Register | Rule |
| --- | --- | --- |
| **Measuring** (scores, framework references, methodology) | Technical / consulting | Use ESCO, EQF, Likert, SJT terminology. Third-person OK. |
| **Interpreting** (AI-generated readings, qualitative analysis) | Personal / peer | Use "tu" / "sei", no paternalism. Italic serif-style display via Space Grotesk Light Italic. |

### Hard rules
- **No emojis anywhere in titles, buttons, navigation, or report copy.** Replace existing emojis with `lucide-react` icons.
- **No exclamation marks** in marketing copy or AI report text.
- **No "Wow", "Fantastico", "Continua così"** style. Address the user as a competent adult.
- All caps **only** on eyebrows (JetBrains Mono, letter-spacing 0.18em).
- Numbers in scores use **comma decimal separator** in Italian (`4,3` not `4.3`).

### Before / after copy samples

❌ Before: *"🎯 Scopri le tue Soft Skills! Compila il nostro test e ricevi subito un report personalizzato ✨"*

✅ After: *"Un assessment delle tue dodici competenze trasversali, mappato sullo standard europeo ESCO. Quaranta minuti, una lettura che resta."*

---

## Components

All components below are in `references/Design System v2.html`. Here's the implementation guide for each, mapped to the Next.js codebase.

### 1. Buttons

Four variants. All `radius-sm` (2px), 13px vertical padding, 22px horizontal, font-weight 500.

| Variant | Background | Text | Use |
| --- | --- | --- | --- |
| `primary` | `ink-900` | `paper-50` | Default action |
| `accent` | `sienna-600` | `paper-50` | Primary CTA per page (max 1) |
| `secondary` | transparent + `1px solid ink-900` | `ink-900` | Secondary action |
| `ghost` | transparent | `ink-700`, hover `sienna-700` | Inline links |

```tsx
// components/ui/Button.tsx (target)
export function Button({ variant = 'primary', children, ...props }) {
  const variants = {
    primary: 'bg-ink-900 text-paper-50 hover:bg-ink-800',
    accent: 'bg-sienna-600 text-paper-50 hover:bg-sienna-700',
    secondary: 'border border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-paper-50',
    ghost: 'text-ink-700 hover:text-sienna-700'
  }
  return (
    <button
      className={`px-[22px] py-[13px] text-[15px] font-medium rounded-sm transition-colors ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 2. ESCO chip

Compact attribution to the European framework. Use everywhere a competence is referenced.

```tsx
<span className="inline-flex items-center gap-2 bg-paper-100 border border-paper-300 px-3 py-1.5 font-mono text-[11px] tracking-wider text-ink-700">
  <span className="w-3.5 h-3.5 rounded-full bg-ink-900 inline-grid place-items-center">
    <span className="text-sienna-500 text-[9px] leading-none">★</span>
  </span>
  <span><b className="font-semibold text-ink-900">ESCO v1.2</b> · Comunicare con gli altri</span>
</span>
```

### 3. Level pill

Pill showing the ESCO level. Use in tables, comparisons, competence headers.

| Level | Background | Score range |
| --- | --- | --- |
| Base | `#B0473A` | 1.0–2.0 |
| Intermedio | `#C68A2E` | 2.1–3.0 |
| Avanzato | `#4F7A53` | 3.1–4.0 |
| Esperto | `#2D5F73` | 4.1–5.0 |

Mono font, 11px, 600 weight, letter-spacing 0.12em, uppercase, padding 5×10px.

### 4. Level track (4-segment)

A 4-step horizontal bar showing progress on the ESCO ladder. Filled segments = levels reached, current segment in `sienna-600`.

```tsx
function LevelTrack({ score }: { score: number }) {
  const currentIdx =
    score >= 4.1 ? 3 : score >= 3.1 ? 2 : score >= 2.1 ? 1 : 0;
  return (
    <div className="grid grid-cols-4 gap-0.5 w-80">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className={`h-3 ${
            i < currentIdx ? 'bg-ink-900' :
            i === currentIdx ? 'bg-sienna-600' :
            'bg-paper-200'
          }`}
        />
      ))}
    </div>
  )
}
```

### 5. Score ring

Circular score visual. SVG, 120×120, 8px stroke. Used for individual competence overview and for the global assessment score.

```tsx
function ScoreRing({ value, max = 5 }) {
  const circumference = 2 * Math.PI * 50; // r=50
  const offset = circumference * (1 - value / max);
  return (
    <svg viewBox="0 0 120 120" className="w-30 h-30">
      <circle cx="60" cy="60" r="50" fill="none"
        className="stroke-paper-200" strokeWidth="8"/>
      <circle cx="60" cy="60" r="50" fill="none"
        className="stroke-ink-900" strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"/>
      <text x="60" y="64" textAnchor="middle"
        className="font-display font-light text-[38px] fill-ink-900">
        {value.toFixed(1).replace('.', ',')}
      </text>
      <text x="60" y="82" textAnchor="middle"
        className="font-mono text-[11px] tracking-wider fill-ink-500">
        / {max.toFixed(1).replace('.', ',')}
      </text>
    </svg>
  )
}
```

### 6. Competence chart (the 12 ESCO bars)

The flagship visualization of the report. Horizontal bars, one per competence, **ordered by score descending**, colored by level. Build it in `recharts` (already in `package.json`).

Structure:
- Skill name (Space Grotesk Medium 18px) + ESCO ID (Mono 10px, ink-500)
- Track: 14px tall, paper-200 background
- Fill: width = `(score / 5) * 100%`, color = level color
- Score: Space Grotesk 26px, with `/5` suffix in Mono ink-400

### 7. Pull quote (AI personalized reading)

The container for AI-generated qualitative text. Italic Space Grotesk Light 28px, line-height 1.32, left border 3px sienna-600, padding-left 32px. Citation in JetBrains Mono uppercase.

### 8. Iconography

Use `lucide-react` (already installed). Tracked icons that should replace existing emojis:

| Emoji used today | Lucide replacement | Context |
| --- | --- | --- |
| 🧑 | `User`, `Users` | Profile, single user |
| 🏢 | `Building2` | Company / organization |
| ✨ | `Sparkles` (use sparingly) or remove | AI features |
| 📊 | `BarChart3`, `LineChart` | Data, dashboards |
| 📋 | `ClipboardList`, `FileText` | Reports, lists |
| ⚡ | `Zap` (avoid) or `Activity` | Speed claims |
| 🎯 | `Target` (avoid) or omit | Goals (just omit usually) |
| 🏆 | `Award`, `Medal` | Achievements |
| 🇪🇺 | text "ESCO v1.2 · Commissione Europea" | Framework attribution |
| ✅ | `Check`, `CheckCircle2` | Completion |

**Stroke width 1.5px everywhere**, monochromatic, no fill, no colored insides. Pass `strokeWidth={1.5}` on every Lucide icon.

---

## Screens & views to implement

### A. Marketing site (`frontend/app/page.tsx`)

Currently a heavy emoji-laden landing. Rebuild with:
- New masthead: two-block wordmark + sober nav (no gradient)
- Hero: Display-1 headline, no stock photo (Unsplash one out), single Display-2 deck + accent CTA
- "Tre cose vere sul prodotto" section: ESCO mapping, doppia evidenza, lettura personalizzata (mirror the design system §01 manifesto)
- Pricing: card with `border border-paper-300`, no shadows, Display-3 prices
- Footer: minimal, JetBrains Mono small caps for nav

### B. Report PDF (5–8 pages)

**Status**: design system established. Next milestone is to design the full report layout. For now, the design system page section §07 shows one applied fragment that demonstrates the system works.

**Sections of a report (data already available from `ai-report-generator.js` output)**:
1. **Cover** (1pp) — wordmark, user name, date, "Profilo strategico" suggested, ESCO v1.2 attribution chip
2. **Overall score + 12 competencies chart** (1pp) — score ring overall, then the bar chart for all 12 ESCO skills
3. **Profile insights** (1pp) — AI-generated summary, patterns, self-awareness, suggested profile, ideal roles
4. **Competence deep-dive** (2–3pp) — for top-N and bottom-N competencies: ScoreRing + LevelTrack + behavioral notes + ESCO mapping table
5. **Development plan** (1pp) — focus areas with current/target score, priority, actions, resources, timeline, quick wins
6. **Certificate** (1pp) — clean cert page with QR + badge URL + wordmark watermark
7. **Methodology & ESCO appendix** (1pp) — Likert + SJT explained, ESCO v1.2 references, EQF scale

### C. Dashboard (`frontend/app/admin/dashboard/page.tsx`)

74KB single file → refactor into composable sections using the design system components. Use the chart and score-ring components extensively.

---

## Files in this handoff

```
design_handoff_valutolab_redesign/
├── README.md                      ← this file
├── PDF_PIPELINE.md                ← critical: how to fix the PDF alignment issue
├── tokens/
│   ├── tailwind.config.snippet.ts ← paste into tailwind.config.ts
│   └── globals.css.snippet.css    ← paste into globals.css
└── references/
    ├── Design System v2.html      ← APPROVED direction (Space Grotesk + two-block logo)
    └── Design System v1.html      ← earlier version, for reference only — DO NOT use
```

---

## Recommended implementation order

1. **Apply the design tokens** (`tokens/tailwind.config.snippet.ts` + `tokens/globals.css.snippet.css`)
2. **Add the Google Fonts** to `app/layout.tsx` via `next/font/google`
3. **Build the primitive components** in `components/ui/` — Button, Chip, LevelPill, LevelTrack, ScoreRing, PullQuote
4. **Replace the wordmark** everywhere — header, footer, favicon, badge
5. **Migrate the PDF pipeline** following `PDF_PIPELINE.md` (this is independent of UI work and unblocks a lot of value)
6. **Redesign the report page** using the new components + new pipeline
7. **Redesign the marketing site** (`app/page.tsx`) using the new system
8. **Refactor the admin dashboard** (`app/admin/dashboard/page.tsx`)

---

## Open questions for the developer

- The current site uses Tailwind class names. The wordmark and certain custom components in the system reference custom values (e.g. `letter-spacing: -0.045em`). Extend the Tailwind config rather than dropping to arbitrary values — config snippet provided.
- Italian decimal separator (`4,3` vs `4.3`) — keep formatting consistent across UI, report, badges. Suggest a helper `formatScore(n: number)` in `lib/format.ts`.
- The AI report generator currently emits an `esco_mapping` block for each competence with `esco_uri`, `onet_reference`, `eqf_range`. This data should be **surfaced visually** in the new report (it's the credibility anchor) — not hidden in a tooltip.
