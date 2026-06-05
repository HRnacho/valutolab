/**
 * Genera l'HTML completo del report PDF per Puppeteer.
 * Layout: 3 pagine
 *   Pag 1 — Cover + Lettura del Profilo
 *   Pag 2 — 12 schede competenze (3 col × 4 righe)
 *   Pag 3 — Certificato con QR code
 */

// ── Costanti design ──────────────────────────────────────────────────────────

const LEVEL_COLORS = {
  Base:       { bg: '#FEF2F0', border: '#B0473A', text: '#B0473A', fill: '#B0473A' },
  Intermedio: { bg: '#FEFCE8', border: '#C68A2E', text: '#C68A2E', fill: '#C68A2E' },
  Avanzato:   { bg: '#F0FDF4', border: '#4F7A53', text: '#4F7A53', fill: '#4F7A53' },
  Esperto:    { bg: '#EFF6FF', border: '#2D5F73', text: '#2D5F73', fill: '#2D5F73' },
}

const CATEGORY_LABELS = {
  communication:    'Comunicazione',
  leadership:       'Leadership',
  problem_solving:  'Problem Solving',
  teamwork:         'Lavoro di Squadra',
  time_management:  'Gestione del Tempo',
  adaptability:     'Adattabilità',
  creativity:       'Creatività',
  critical_thinking:'Pensiero Critico',
  empathy:          'Empatia',
  resilience:       'Resilienza',
  negotiation:      'Negoziazione',
  decision_making:  'Decision Making',
}

// Ordine canonico per le schede
const CANONICAL_ORDER = [
  'communication', 'leadership', 'problem_solving',
  'teamwork', 'time_management', 'adaptability',
  'creativity', 'critical_thinking', 'empathy',
  'resilience', 'negotiation', 'decision_making',
]

function esc(str) {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function scoreToLevel(score) {
  const s = parseFloat(score)
  if (s >= 4.1) return 'Esperto'
  if (s >= 3.1) return 'Avanzato'
  if (s >= 2.1) return 'Intermedio'
  return 'Base'
}

function fmt(n, decimals = 1) {
  return Number(n).toFixed(decimals).replace('.', ',')
}

// Prende solo la prima frase completa (fino al primo punto)
function firstSentence(text, fallbackLen = 110) {
  if (!text) return ''
  const dot = text.search(/[.!?]/)
  if (dot > 10 && dot < 200) return text.substring(0, dot + 1)
  return text.substring(0, fallbackLen) + (text.length > fallbackLen ? '…' : '')
}

// SVG donut ring per il punteggio
function scoreRing(score, level) {
  const lc = LEVEL_COLORS[level]
  const r = 46
  const circ = 2 * Math.PI * r  // 289.0
  const filled = (parseFloat(score) / 5) * circ
  const scoreLabel = fmt(score)
  return `<svg width="130" height="130" viewBox="0 0 130 130" style="flex-shrink:0;">
    <!-- Track -->
    <circle cx="65" cy="65" r="${r}" fill="none" stroke="#ECE6D8" stroke-width="9"/>
    <!-- Arc progresso -->
    <circle cx="65" cy="65" r="${r}" fill="none"
      stroke="${lc.fill}"
      stroke-width="9"
      stroke-linecap="round"
      stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}"
      transform="rotate(-90 65 65)"/>
    <!-- Score number -->
    <text x="65" y="60" text-anchor="middle"
      font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
      font-size="28" font-weight="300" letter-spacing="-1" fill="#0E1A2B">${scoreLabel}</text>
    <!-- /5,0 -->
    <text x="65" y="76" text-anchor="middle"
      font-family="monospace" font-size="11" fill="#94A0B5">/5,0</text>
    <!-- Level label -->
    <text x="65" y="94" text-anchor="middle"
      font-family="monospace" font-size="9" font-weight="700"
      letter-spacing="1.5" fill="${lc.fill}">${level.toUpperCase()}</text>
  </svg>`
}

// ── WORDMARK ─────────────────────────────────────────────────────────────────

function wordmark(size = 24) {
  return `<span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:${size}px;letter-spacing:-0.045em;display:inline-flex;">
    <span style="background:#0E1A2B;color:#FBF8F2;padding:0.18em 0.22em 0.14em;display:inline-block;">Valuto</span>
    <span style="background:#B85C3A;color:#FBF8F2;padding:0.18em 0.22em 0.14em;display:inline-block;">Lab</span>
  </span>`
}

// ── PAGINA 1: Cover + Lettura del Profilo ────────────────────────────────────

function renderPage1(profile, assessment, profileInsights) {
  const date = new Date(assessment.completed_at || assessment.created_at)
    .toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalScore = fmt(assessment.total_score)
  const level = scoreToLevel(assessment.total_score)
  const lc = LEVEL_COLORS[level]

  // Sezione profilo insights
  const patterns = (profileInsights?.patterns || []).slice(0, 4).map(p =>
    `<div style="display:flex;gap:10px;align-items:flex-start;padding:7px 0;border-bottom:1px solid #ECE6D8;">
      <span style="color:#B85C3A;font-size:13px;line-height:1.5;flex-shrink:0;font-weight:700;">›</span>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#2E3F58;line-height:1.5;margin:0;">${esc(p)}</p>
    </div>`
  ).join('')

  const roles = (profileInsights?.ideal_roles || []).map(r =>
    `<span style="display:inline-block;border:1px solid #D9D0BC;color:#2E3F58;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;padding:3px 10px;border-radius:2px;margin:3px 3px 3px 0;">${esc(r)}</span>`
  ).join('')

  const profileBlock = profileInsights ? `
    <!-- Divider -->
    <div style="border-top:1px solid #D9D0BC;margin:20px 0 18px;"></div>

    <!-- Profilo suggerito -->
    <div style="border-left:3px solid #B85C3A;padding-left:16px;margin-bottom:16px;">
      <p style="font-family:monospace;font-size:9px;letter-spacing:0.15em;text-transform:uppercase;color:#B85C3A;margin-bottom:5px;">Profilo suggerito</p>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:17px;font-weight:600;color:#0E1A2B;line-height:1.3;">${esc(profileInsights.suggested_profile || '')}</p>
    </div>

    <!-- Sintesi -->
    <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12.5px;line-height:1.65;color:#2E3F58;margin-bottom:16px;">${esc(profileInsights.summary || '')}</p>

    <!-- Pattern -->
    ${patterns ? `
    <p style="font-family:monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6F7E96;margin-bottom:4px;">Pattern comportamentali</p>
    <div style="margin-bottom:14px;">${patterns}</div>` : ''}

    <!-- Ruoli -->
    ${roles ? `
    <p style="font-family:monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6F7E96;margin-bottom:6px;">Ruoli ideali</p>
    <div style="margin-bottom:14px;">${roles}</div>` : ''}

    <!-- Punto di distinzione -->
    ${profileInsights.unique_strengths ? `
    <div style="background:#F6F2EA;border-left:3px solid #0E1A2B;padding:12px 14px;">
      <p style="font-family:monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:#6F7E96;margin-bottom:5px;">Punto di distinzione</p>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#0E1A2B;line-height:1.6;">${esc(profileInsights.unique_strengths)}</p>
    </div>` : ''}
  ` : ''

  return `
  <div class="page">
    <!-- Header: wordmark + ring affiancati -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;">
      <div style="flex:1;">
        <!-- Wordmark -->
        <div style="margin-bottom:20px;">${wordmark(26)}</div>
        <!-- Eyebrow -->
        <p style="font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:10px;">Assessment · Competenze Trasversali</p>
        <!-- Nome -->
        <h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:40px;font-weight:700;letter-spacing:-0.03em;color:#0E1A2B;line-height:1.05;margin-bottom:6px;">${esc(profile.full_name || 'Utente ValutoLab')}</h1>
        <p style="font-family:monospace;font-size:12px;color:#6F7E96;">${esc(date)}</p>
      </div>
      <!-- Score ring -->
      <div style="flex-shrink:0;margin-left:16px;">
        ${scoreRing(assessment.total_score, level)}
      </div>
    </div>

    ${profileBlock}

    <div style="flex:1;"></div>

    <!-- Footer -->
    <div style="border-top:1px solid #D9D0BC;padding-top:16px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:monospace;font-size:9px;color:#94A0B5;letter-spacing:0.12em;text-transform:uppercase;">ESCO v1.2 · Commissione Europea</span>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">valutolab.com</span>
    </div>
  </div>`
}

// ── PAGINA 2: 12 Schede Competenze ──────────────────────────────────────────

function renderPage2(results, categoryInterps) {
  // Mappa risultati per categoria
  const scoreMap = {}
  for (const r of results) {
    scoreMap[r.skill_category] = r
  }

  const cards = CANONICAL_ORDER.map(cat => {
    const r = scoreMap[cat] || {}
    const interp = (categoryInterps || {})[cat] || {}
    const score = parseFloat(r.final_score || interp.score || 0)
    const level = scoreToLevel(score)
    const lc = LEVEL_COLORS[level]
    const label = CATEGORY_LABELS[cat] || cat
    const description = interp.description || ''
    const pct = Math.round((score / 5) * 100)

    return `
    <div style="background:#FFFFFF;border:1px solid #D9D0BC;border-radius:2px;border-top:3px solid ${lc.fill};padding:14px 14px 12px;display:flex;flex-direction:column;gap:8px;">
      <!-- Header: nome + badge -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13.5px;font-weight:600;color:#0E1A2B;line-height:1.2;">${esc(label)}</span>
        <span style="display:inline-block;background:${lc.fill};color:#FBF8F2;font-family:monospace;font-size:8.5px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;padding:2px 7px;border-radius:2px;white-space:nowrap;flex-shrink:0;">${level}</span>
      </div>

      <!-- Descrizione: prima frase completa -->
      ${description ? `<p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;color:#4E5E78;line-height:1.6;margin:0;flex:1;">${esc(firstSentence(description))}</p>` : '<div style="flex:1;"></div>'}

      <!-- Barra score -->
      <div style="margin-top:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:6px;background:#ECE6D8;border-radius:2px;overflow:hidden;">
            <div style="width:${pct}%;height:100%;background:${lc.fill};border-radius:2px;"></div>
          </div>
          <span style="font-family:monospace;font-size:12px;font-weight:700;color:#0E1A2B;min-width:28px;text-align:right;">${fmt(score)}</span>
        </div>
      </div>
    </div>`
  }).join('')

  return `
  <div class="page">
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:6px;">§ 02 — Competenze</p>
    <h2 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:30px;font-weight:500;letter-spacing:-0.025em;color:#0E1A2B;margin-bottom:20px;">12 Competenze ESCO</h2>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;flex:1;">
      ${cards}
    </div>

    <div style="flex:1;min-height:0;"></div>
    <div style="border-top:1px solid #D9D0BC;padding-top:14px;display:flex;justify-content:space-between;margin-top:16px;">
      <span style="font-family:monospace;font-size:9px;color:#94A0B5;">ESCO v1.2 · valutolab.com</span>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">2 / 3</span>
    </div>
  </div>`
}

// ── PAGINA 3: Certificato con QR ─────────────────────────────────────────────

function renderPage3(profile, assessment, qrDataUrl) {
  const date = new Date(assessment.completed_at || assessment.created_at)
    .toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const shortId = assessment.id.substring(0, 8).toUpperCase()

  return `
  <div class="page cert-page">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 20mm;">

      <!-- Wordmark grande -->
      <div style="margin-bottom:36px;">${wordmark(38)}</div>

      <p style="font-family:monospace;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:24px;">Certifica che</p>

      <h2 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:38px;font-weight:700;letter-spacing:-0.03em;color:#0E1A2B;margin-bottom:16px;">${esc(profile.full_name || 'Utente ValutoLab')}</h2>

      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#4E5E78;max-width:380px;line-height:1.65;margin-bottom:32px;">
        ha completato con successo l'assessment delle dodici competenze trasversali
        mappate sul framework europeo ESCO v1.2.
      </p>

      <!-- Score -->
      <div style="display:inline-flex;align-items:baseline;gap:6px;margin-bottom:32px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:72px;font-weight:300;letter-spacing:-0.04em;color:#0E1A2B;line-height:1;">${fmt(assessment.total_score)}</span>
        <span style="font-family:monospace;font-size:15px;color:#94A0B5;">/5,0</span>
      </div>

      <!-- Data e ID -->
      <p style="font-family:monospace;font-size:11px;color:#94A0B5;letter-spacing:0.05em;margin-bottom:4px;">${esc(date)}</p>
      <p style="font-family:monospace;font-size:10px;color:#BCC4D2;letter-spacing:0.08em;margin-bottom:${qrDataUrl ? '32px' : '0'};">ID: ${shortId}</p>

      <!-- QR Code -->
      ${qrDataUrl ? `
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
        <img src="${qrDataUrl}" alt="QR Code" style="width:100px;height:100px;border:1px solid #D9D0BC;padding:6px;background:#FBF8F2;" />
        <p style="font-family:monospace;font-size:9px;color:#94A0B5;letter-spacing:0.08em;">Scansiona per visualizzare online</p>
      </div>` : ''}
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #D9D0BC;padding-top:18px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p style="font-family:monospace;font-size:9px;color:#94A0B5;letter-spacing:0.10em;text-transform:uppercase;">ESCO v1.2 · Commissione Europea, maggio 2024</p>
        <p style="font-family:monospace;font-size:9px;color:#BCC4D2;margin-top:2px;">valutolab.com · Verificabile online</p>
      </div>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">3 / 3</span>
    </div>
  </div>`
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function buildReportHtml({ profile, assessment, results, qualitativeReport, qrDataUrl }) {
  const page1 = renderPage1(profile, assessment, qualitativeReport?.profile_insights ?? null)
  const page2 = renderPage2(results, qualitativeReport?.category_interpretations ?? null)
  const page3 = renderPage3(profile, assessment, qrDataUrl)

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ValutoLab — Report ${esc(profile.full_name || '')}</title>
  <style>
    @page { size: A4; margin: 0; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 210mm;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 18mm 18mm 16mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      background: #FBF8F2;
    }
    .cert-page { background: #FBF8F2; }
    .page:last-child { page-break-after: avoid; }
  </style>
</head>
<body>
  ${page1}
  ${page2}
  ${page3}
</body>
</html>`
}
