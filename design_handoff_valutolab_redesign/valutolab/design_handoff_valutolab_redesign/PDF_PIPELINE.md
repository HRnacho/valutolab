# PDF Pipeline Migration — Fix for Misaligned Reports

## TL;DR

The current PDF reports are **misaligned, blurry, and have selectable-text issues**. The cause is **not** a design issue — it's the PDF generation method. We need to migrate from client-side raster capture (`jspdf` + `html2canvas`) to server-side vector PDF rendering (Puppeteer).

This is a **high-impact, well-scoped engineering task** that should be done in parallel with (or before) the UI redesign work, because:
- It's the root cause of a user-visible defect the customer cited explicitly
- A vector PDF will showcase the new design system properly
- It unblocks proper pagination control via CSS `@page`

---

## The current implementation

From `frontend/package.json`:
```json
"dependencies": {
  "jspdf": "^2.5.1",
  "html2canvas": "^1.4.1",
  ...
}
```

The flow today (typical pattern):
1. The user lands on the results page (React)
2. They click "Scarica PDF"
3. JavaScript runs `html2canvas(resultDiv)` to rasterize the DOM into a PNG (in-browser)
4. `jspdf` wraps that PNG into a PDF and triggers a download

### Why this produces bad PDFs

| Symptom | Root cause |
| --- | --- |
| **Rows / columns misaligned** | html2canvas re-implements CSS layout from scratch in JS. Many CSS features (flex gaps, subpixel positioning, font hinting, `text-wrap: balance`, etc.) render differently than the browser. |
| **Text not selectable / not searchable** | The PDF contains a PNG, not text. Every character is just pixels. |
| **Blurry on print or zoom** | Raster image at fixed DPI. Zoom in → pixelation. |
| **Different output per browser / OS** | Canvas rendering varies across Chrome/Safari/Firefox and across OS font stacks. |
| **Pagination "cuts" in the middle of a chart** | jspdf has no notion of CSS `page-break-before/after`. It just slices the giant PNG every 297mm. |
| **No repeating header/footer per page** | Same reason — pagination is dumb image-slicing. |
| **Heavy file size** | A multi-page raster PDF is 5–20× larger than a vector equivalent. |
| **Accessibility broken** | Screen readers see one image, no semantic structure. |

This is a **known limitation** of the `jspdf` + `html2canvas` pattern. It works for "save this small card as an image" use cases. It fails for multi-page formatted documents like an assessment report.

---

## The fix: server-side Puppeteer

**Puppeteer** runs a headless Chromium server-side, navigates to a URL (or loads HTML), and exports it as a **vector PDF using Chrome's print pipeline** — the same pipeline that produces the gold-standard "Save as PDF" output from Chrome's print dialog.

### Why this solves every symptom above

| What you get | Why |
| --- | --- |
| Vector text | Chrome's print uses the real font outlines, not pixels |
| Selectable + searchable | Text is text in the PDF, not an image |
| Identical rendering | The same Chromium engine every time, regardless of who clicks "download" |
| Real CSS pagination | `@page` rules and `page-break-*` work natively |
| Per-page header/footer | Puppeteer exposes `headerTemplate` / `footerTemplate` options |
| Tiny file size | Vector + native font subsetting |
| Accessibility preserved | Tagged PDF output if you enable `tagged: true` |

### Architecture proposal

```
┌─────────────────────────────────────────┐
│ User clicks "Scarica report PDF"        │
└─────────────────┬───────────────────────┘
                  │ POST /api/reports/:id/pdf
                  ▼
┌─────────────────────────────────────────┐
│ Backend (Express)                       │
│ 1. Verify user owns assessment :id      │
│ 2. Spawn Puppeteer                      │
│ 3. await page.goto(                     │
│      `${BASE}/reports/${id}/print`,    │
│      { auth token in cookie })          │
│ 4. await page.pdf({                     │
│      format: 'A4',                      │
│      printBackground: true,             │
│      preferCSSPageSize: true,           │
│      headerTemplate, footerTemplate,    │
│    })                                   │
│ 5. Stream PDF back to client            │
└─────────────────────────────────────────┘
                  ▲
                  │ Renders normally in browser too
                  │
┌─────────────────┴───────────────────────┐
│ Next.js route: /reports/[id]/print      │
│ (the same components as /reports/[id]   │
│  but with print-optimized CSS)          │
└─────────────────────────────────────────┘
```

The key insight: **the same React components render the report on screen and in the PDF**. The PDF is just a snapshot of the print stylesheet. No divergence between web view and printed view.

---

## Implementation plan

### Step 1 — Add dependencies

```bash
cd backend
npm install puppeteer
# OR for smaller production images:
npm install puppeteer-core @sparticuz/chromium
```

Notes:
- `puppeteer` bundles Chromium (~170MB) — fine for dev, big for Docker
- `puppeteer-core` + `@sparticuz/chromium` — slimmer, works on serverless / Vercel functions / lightweight containers (recommended for production)

### Step 2 — Create a print-only report route

`frontend/app/reports/[id]/print/page.tsx` — server component:

```tsx
// Strips nav/footer, uses print CSS, identical components.
export default async function ReportPrint({ params }: { params: { id: string }}) {
  const report = await fetchReport(params.id) // server-side
  return (
    <>
      <link rel="stylesheet" href="/styles/print.css" />
      <ReportCover {...report} />
      <ReportScoreOverview {...report} />
      <ReportCompetenceChart {...report} />
      <ReportInsights {...report} />
      <ReportDevelopmentPlan {...report} />
      <ReportCertificate {...report} />
    </>
  )
}
```

### Step 3 — Print stylesheet

`public/styles/print.css`:

```css
@page {
  size: A4;
  margin: 14mm 16mm;
}

@page :first {
  margin: 0; /* cover bleeds full-page */
}

/* Each major section starts a new page */
.report-section {
  page-break-before: always;
}
.report-section:first-of-type {
  page-break-before: avoid;
}

/* Avoid breaks inside charts and key blocks */
.score-ring,
.competence-chart,
.pull-quote,
.cert-block {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Print-friendly colors */
* {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* Hide anything that's UI-only */
.no-print, nav, header.app-header, footer.app-footer {
  display: none !important;
}
```

### Step 4 — Backend endpoint

`backend/routes/reports.js`:

```js
import express from 'express'
import puppeteer from 'puppeteer'

const router = express.Router()

router.get('/:id/pdf', async (req, res) => {
  // 1. Verify ownership
  const userId = req.user.id
  const assessmentId = req.params.id
  const owns = await verifyOwnership(userId, assessmentId)
  if (!owns) return res.status(403).end()

  // 2. Spawn browser
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  })
  const page = await browser.newPage()

  // 3. Authenticate the headless browser as the user
  await page.setCookie({
    name: 'auth_token',
    value: req.cookies.auth_token,
    domain: new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname,
    path: '/'
  })

  // 4. Navigate to print route
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/reports/${assessmentId}/print`
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

  // 5. Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: `<div></div>`, // empty header, footer-only
    footerTemplate: `
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #6F7E96; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between;">
        <span>ValutoLab · ESCO v1.2</span>
        <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
      </div>
    `,
    margin: { top: '14mm', bottom: '20mm', left: '16mm', right: '16mm' }
  })

  await browser.close()

  // 6. Stream back
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="valutolab-${assessmentId}.pdf"`)
  res.send(pdf)
})

export default router
```

### Step 5 — Replace the frontend download trigger

```tsx
// Before: heavy client-side rasterization
async function downloadPDF() {
  const canvas = await html2canvas(reportRef.current)
  const pdf = new jsPDF()
  pdf.addImage(canvas, 'PNG', 0, 0, ...)
  pdf.save('report.pdf')
}

// After: server-side, instant
async function downloadPDF(assessmentId: string) {
  window.location.href = `/api/reports/${assessmentId}/pdf`
}
```

### Step 6 — Remove unused dependencies

```bash
cd frontend
npm uninstall jspdf html2canvas
```

This shaves ~600KB of JS off the client bundle.

---

## Edge cases & gotchas

| Concern | Mitigation |
| --- | --- |
| Cold-start latency on serverless | Use `@sparticuz/chromium` and warm the function, or keep a long-running container |
| Webfonts not loading in headless | Wait for `document.fonts.ready` before `page.pdf()`: `await page.evaluateHandle('document.fonts.ready')` |
| Charts (Recharts) not finished animating | Set `isAnimationActive={false}` on chart components in the print route |
| Different language locale | Pass locale via URL param or cookie to the print route |
| Authentication of the headless browser | Pass auth token in cookie as shown above, OR use a short-lived signed URL (`/reports/:id/print?token=...`) — cleaner but requires token generation |
| Memory leaks | Always `await browser.close()` even on errors — wrap in try/finally |
| Concurrent requests | Pool browser instances (e.g. with `generic-pool` or `puppeteer-cluster`) for scale |

---

## Estimated effort

- Migration: **1–2 days** for an experienced Next.js + Node dev
- Polish on print CSS (page breaks, headers/footers): **0.5 day**
- Removing the old `jspdf`/`html2canvas` code: **0.5 day**

Total: **~2–3 days** to fully resolve the misalignment issue and establish the new pipeline ready for the redesigned report.

---

## Why do this before / alongside the UI redesign

If you redesign the report UI but keep `jspdf` + `html2canvas`, you'll inherit all the same problems with a prettier raster image. The pipeline fix is the precondition for the visual redesign to actually land cleanly.

Recommended sequence:
1. Migrate pipeline (this doc) — even keeping the old report markup, the output PDF will already look better
2. Build the new design system primitives (`components/ui/*`) — Button, Chip, ScoreRing, LevelTrack, etc.
3. Redesign the report page using the new primitives + the new print CSS

By the time the new report design ships, the pipeline is already vector and aligned — no last-minute fire drill.
