/**
 * Genera l'HTML completo del report PDF per Puppeteer.
 * Tutto inline — nessuna dipendenza esterna, funziona headless.
 */

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

function scoreBar(score, color) {
  const pct = Math.round((parseFloat(score) / 5) * 100)
  return `
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="flex:1;height:10px;background:#ECE6D8;border-radius:2px;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:2px;"></div>
      </div>
      <span style="font-family:monospace;font-size:13px;font-weight:600;color:#0E1A2B;min-width:36px;text-align:right;">${fmt(score)}</span>
    </div>`
}

// ── PAGINA 1: Cover ──────────────────────────────────────────────────────────

function renderCover(profile, assessment) {
  const date = new Date(assessment.completed_at || assessment.created_at)
    .toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalScore = fmt(assessment.total_score)
  const level = scoreToLevel(assessment.total_score)
  const lc = LEVEL_COLORS[level]

  return `
  <div class="page cover-page">
    <!-- Wordmark -->
    <div style="margin-bottom:80px;">
      <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:28px;letter-spacing:-0.045em;display:inline-flex;">
        <span style="background:#0E1A2B;color:#FBF8F2;padding:0.18em 0.22em 0.14em;display:inline-block;">Valuto</span>
        <span style="background:#B85C3A;color:#FBF8F2;padding:0.18em 0.22em 0.14em;display:inline-block;">Lab</span>
      </span>
    </div>

    <!-- Eyebrow -->
    <p style="font-family:monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:24px;">
      Assessment · Competenze Trasversali
    </p>

    <!-- Nome utente -->
    <h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:52px;font-weight:700;letter-spacing:-0.03em;color:#0E1A2B;line-height:1.05;margin-bottom:16px;">
      ${esc(profile.full_name || 'Utente ValutoLab')}
    </h1>

    <p style="font-family:monospace;font-size:13px;color:#6F7E96;margin-bottom:60px;">${esc(date)}</p>

    <!-- Score block -->
    <div style="display:inline-flex;align-items:baseline;gap:8px;margin-bottom:12px;">
      <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:96px;font-weight:300;letter-spacing:-0.04em;color:#0E1A2B;line-height:1;">${totalScore}</span>
      <span style="font-family:monospace;font-size:18px;color:#94A0B5;">/5,0</span>
    </div>
    <div style="margin-bottom:48px;">
      <span style="display:inline-block;background:${lc.fill};color:#FBF8F2;font-family:monospace;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding:6px 14px;border-radius:2px;">${level}</span>
    </div>

    <!-- Spacer -->
    <div style="flex:1;"></div>

    <!-- Footer -->
    <div style="border-top:1px solid #D9D0BC;padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-family:monospace;font-size:10px;color:#94A0B5;letter-spacing:0.12em;text-transform:uppercase;">ESCO v1.2 · Commissione Europea</span>
      <span style="font-family:monospace;font-size:10px;color:#BCC4D2;">valutolab.com</span>
    </div>
  </div>`
}

// ── PAGINA 2: Score + 12 barre ───────────────────────────────────────────────

function renderScorePage(results) {
  const sorted = [...results].sort((a, b) => parseFloat(b.final_score) - parseFloat(a.final_score))

  const bars = sorted.map(r => {
    const level = scoreToLevel(r.final_score)
    const lc = LEVEL_COLORS[level]
    return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:500;color:#0E1A2B;">${esc(CATEGORY_LABELS[r.skill_category] || r.skill_category)}</span>
          <span style="display:inline-block;background:${lc.fill};color:#FBF8F2;font-family:monospace;font-size:10px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;padding:3px 8px;border-radius:2px;">${level}</span>
        </div>
        ${scoreBar(r.final_score, lc.fill)}
        ${r.esco_uri ? `<p style="font-family:monospace;font-size:9px;color:#94A0B5;margin-top:3px;">${esc(r.esco_group || '')}</p>` : ''}
      </div>`
  }).join('')

  return `
  <div class="page">
    <p style="font-family:monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:8px;">§ 02 — Profilo Competenze</p>
    <h2 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:34px;font-weight:500;letter-spacing:-0.025em;color:#0E1A2B;margin-bottom:40px;">12 Competenze ESCO</h2>
    <div>${bars}</div>
    <div style="flex:1;"></div>
    <div style="border-top:1px solid #D9D0BC;padding-top:16px;display:flex;justify-content:space-between;">
      <span style="font-family:monospace;font-size:9px;color:#94A0B5;">ESCO v1.2 · valutolab.com</span>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">2 / 5</span>
    </div>
  </div>`
}

// ── PAGINA 3: Profile insights ───────────────────────────────────────────────

function renderInsightsPage(profileInsights) {
  if (!profileInsights) return ''

  const patterns = (profileInsights.patterns || []).map(p =>
    `<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #ECE6D8;">
      <span style="color:#B85C3A;font-size:16px;line-height:1.4;flex-shrink:0;">›</span>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#2E3F58;line-height:1.55;">${esc(p)}</p>
    </div>`
  ).join('')

  const roles = (profileInsights.ideal_roles || []).map(r =>
    `<span style="display:inline-block;border:1px solid #D9D0BC;color:#2E3F58;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;padding:4px 12px;border-radius:2px;margin:4px 4px 4px 0;">${esc(r)}</span>`
  ).join('')

  return `
  <div class="page">
    <p style="font-family:monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:8px;">§ 03 — Profilo</p>
    <h2 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:34px;font-weight:500;letter-spacing:-0.025em;color:#0E1A2B;margin-bottom:32px;">Lettura del Profilo</h2>

    <!-- Profilo suggerito -->
    <div style="border-left:3px solid #B85C3A;padding-left:24px;margin-bottom:32px;">
      <p style="font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#B85C3A;margin-bottom:8px;">Profilo suggerito</p>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:500;color:#0E1A2B;">${esc(profileInsights.suggested_profile || '')}</p>
    </div>

    <!-- Sintesi -->
    <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#2E3F58;margin-bottom:32px;">${esc(profileInsights.summary || '')}</p>

    <!-- Pattern comportamentali -->
    ${patterns ? `
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6F7E96;margin-bottom:4px;">Pattern comportamentali</p>
    <div style="margin-bottom:28px;">${patterns}</div>` : ''}

    <!-- Ruoli ideali -->
    ${roles ? `
    <p style="font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6F7E96;margin-bottom:8px;">Ruoli ideali</p>
    <div style="margin-bottom:28px;">${roles}</div>` : ''}

    <!-- Unicità -->
    ${profileInsights.unique_strengths ? `
    <div style="background:#F6F2EA;border-left:3px solid #0E1A2B;padding:16px 20px;">
      <p style="font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#6F7E96;margin-bottom:6px;">Punto di distinzione</p>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;color:#0E1A2B;line-height:1.6;">${esc(profileInsights.unique_strengths)}</p>
    </div>` : ''}

    <div style="flex:1;"></div>
    <div style="border-top:1px solid #D9D0BC;padding-top:16px;display:flex;justify-content:space-between;">
      <span style="font-family:monospace;font-size:9px;color:#94A0B5;">ESCO v1.2 · valutolab.com</span>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">3 / 5</span>
    </div>
  </div>`
}

// ── PAGINA 4: Piano di sviluppo ───────────────────────────────────────────────

function renderDevelopmentPage(developmentPlan) {
  if (!developmentPlan) return ''

  const PRIORITY_COLORS = { Alta: '#B0473A', Media: '#C68A2E', Bassa: '#4F7A53' }

  const areas = (developmentPlan.focus_areas || []).map(area => {
    const pColor = PRIORITY_COLORS[area.priority] || PRIORITY_COLORS['Media']
    const actions = (area.actions || []).map((a, i) =>
      `<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #ECE6D8;">
        <span style="font-family:monospace;font-size:11px;color:#B85C3A;font-weight:600;min-width:16px;">${i + 1}.</span>
        <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2E3F58;line-height:1.5;">${esc(a)}</p>
      </div>`
    ).join('')
    const resources = (area.resources || []).map(r =>
      `<span style="display:inline-block;border:1px solid #D9D0BC;color:#4E5E78;font-family:monospace;font-size:10px;padding:3px 8px;border-radius:2px;margin:3px 3px 3px 0;">${esc(r)}</span>`
    ).join('')

    return `
    <div style="border:1px solid #D9D0BC;padding:20px;margin-bottom:16px;border-radius:2px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <h4 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:17px;font-weight:600;color:#0E1A2B;">${esc(area.skill)}</h4>
        <span style="display:inline-block;background:${pColor};color:#FBF8F2;font-family:monospace;font-size:10px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;padding:3px 10px;border-radius:2px;">Priorità ${esc(area.priority)}</span>
      </div>
      <p style="font-family:monospace;font-size:11px;color:#94A0B5;margin-bottom:10px;">${fmt(area.current_score)} → ${fmt(area.target_score)} / 5,0</p>
      ${area.gap_analysis ? `<p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#4E5E78;line-height:1.55;margin-bottom:12px;">${esc(area.gap_analysis)}</p>` : ''}
      ${actions}
      ${resources ? `<div style="margin-top:10px;">${resources}</div>` : ''}
    </div>`
  }).join('')

  const quickWins = (developmentPlan.quick_wins || []).map((w, i) =>
    `<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #ECE6D8;last-child:border-bottom:none;">
      <span style="font-family:monospace;font-size:11px;font-weight:700;color:#B85C3A;min-width:20px;">${i + 1}.</span>
      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#2E3F58;line-height:1.5;">${esc(w)}</p>
    </div>`
  ).join('')

  return `
  <div class="page">
    <p style="font-family:monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:8px;">§ 04 — Sviluppo</p>
    <h2 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:34px;font-weight:500;letter-spacing:-0.025em;color:#0E1A2B;margin-bottom:8px;">Piano di Sviluppo</h2>
    <p style="font-family:monospace;font-size:12px;color:#94A0B5;margin-bottom:32px;">Timeline: ${esc(developmentPlan.timeline || '90 giorni')}</p>

    ${areas}

    ${quickWins ? `
    <div style="background:#F6F2EA;padding:20px;border-radius:2px;margin-top:8px;">
      <p style="font-family:monospace;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#B85C3A;margin-bottom:12px;">Quick wins — azioni immediate</p>
      ${quickWins}
    </div>` : ''}

    <div style="flex:1;"></div>
    <div style="border-top:1px solid #D9D0BC;padding-top:16px;display:flex;justify-content:space-between;">
      <span style="font-family:monospace;font-size:9px;color:#94A0B5;">ESCO v1.2 · valutolab.com</span>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">4 / 5</span>
    </div>
  </div>`
}

// ── PAGINA 5: Certificato ────────────────────────────────────────────────────

function renderCertPage(profile, assessment) {
  const date = new Date(assessment.completed_at || assessment.created_at)
    .toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
  const shortId = assessment.id.substring(0, 8).toUpperCase()

  return `
  <div class="page cert-page">
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">

      <!-- Wordmark grande -->
      <div style="margin-bottom:48px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:700;font-size:42px;letter-spacing:-0.045em;display:inline-flex;">
          <span style="background:#0E1A2B;color:#FBF8F2;padding:0.18em 0.22em 0.14em;display:inline-block;">Valuto</span>
          <span style="background:#B85C3A;color:#FBF8F2;padding:0.18em 0.22em 0.14em;display:inline-block;">Lab</span>
        </span>
      </div>

      <p style="font-family:monospace;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#6F7E96;margin-bottom:32px;">Certifica che</p>

      <h2 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:40px;font-weight:700;letter-spacing:-0.03em;color:#0E1A2B;margin-bottom:8px;">${esc(profile.full_name || 'Utente ValutoLab')}</h2>

      <p style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;color:#4E5E78;max-width:420px;line-height:1.6;margin-bottom:40px;">
        ha completato con successo l'assessment delle dodici competenze trasversali
        mappate sul framework europeo ESCO v1.2.
      </p>

      <!-- Score -->
      <div style="display:inline-flex;align-items:baseline;gap:8px;margin-bottom:40px;">
        <span style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:72px;font-weight:300;letter-spacing:-0.04em;color:#0E1A2B;line-height:1;">${fmt(assessment.total_score)}</span>
        <span style="font-family:monospace;font-size:16px;color:#94A0B5;">/5,0</span>
      </div>

      <!-- Data e ID -->
      <p style="font-family:monospace;font-size:12px;color:#94A0B5;letter-spacing:0.05em;margin-bottom:4px;">${esc(date)}</p>
      <p style="font-family:monospace;font-size:10px;color:#BCC4D2;letter-spacing:0.08em;">ID: ${shortId}</p>
    </div>

    <!-- Footer cert -->
    <div style="border-top:1px solid #D9D0BC;padding-top:20px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <p style="font-family:monospace;font-size:9px;color:#94A0B5;letter-spacing:0.12em;text-transform:uppercase;">ESCO v1.2 · Commissione Europea, maggio 2024</p>
        <p style="font-family:monospace;font-size:9px;color:#BCC4D2;margin-top:2px;">valutolab.com · Verificabile online</p>
      </div>
      <span style="font-family:monospace;font-size:9px;color:#BCC4D2;">5 / 5</span>
    </div>
  </div>`
}

// ── Entry point ──────────────────────────────────────────────────────────────

export function buildReportHtml({ profile, assessment, results, qualitativeReport }) {
  const cover    = renderCover(profile, assessment)
  const scores   = renderScorePage(results)
  const insights = qualitativeReport ? renderInsightsPage(qualitativeReport.profile_insights) : ''
  const devPlan  = qualitativeReport ? renderDevelopmentPage(qualitativeReport.development_plan) : ''
  const cert     = renderCertPage(profile, assessment)

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>ValutoLab — Report ${esc(profile.full_name || '')}</title>
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    @page :first { margin: 0; }

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

    .cover-page {
      padding: 22mm 22mm 18mm;
    }

    .cert-page {
      background: #FBF8F2;
    }

    .page:last-child {
      page-break-after: avoid;
    }
  </style>
</head>
<body>
  ${cover}
  ${scores}
  ${insights}
  ${devPlan}
  ${cert}
</body>
</html>`
}
