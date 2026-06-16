import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import puppeteer from 'puppeteer-core';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();
const anthropic = new Anthropic();

const SKILL_LABELS = {
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
};

function escoLevel(score) {
  const v = Number(score);
  if (v >= 4.1) return { label: 'Esperto',     color: '#1B4332' };
  if (v >= 3.1) return { label: 'Avanzato',    color: '#2D6A4F' };
  if (v >= 2.1) return { label: 'Intermedio',  color: '#D4A017' };
  return               { label: 'Base',        color: '#C0392B' };
}

// ── GET /api/team-reports/:orgId ─────────────────────────────────────────────
router.get('/:orgId', verifyToken, async (req, res) => {
  const { orgId } = req.params;
  const userId = req.user.supabase_id ?? req.user.id;

  try {
    const membership = await db.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Accesso non autorizzato' });
    }

    const result = await db.query(
      'SELECT * FROM team_reports WHERE organization_id = $1',
      [orgId]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, report: null });
    }

    res.json({ success: true, report: result.rows[0] });
  } catch (err) {
    console.error('GET /team-reports/:orgId error:', err);
    res.status(500).json({ success: false, message: 'Errore interno' });
  }
});

// ── POST /api/team-reports/:orgId/generate ───────────────────────────────────
router.post('/:orgId/generate', verifyToken, async (req, res) => {
  const { orgId } = req.params;
  const userId = req.user.supabase_id ?? req.user.id;

  try {
    const membership = await db.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Accesso non autorizzato' });
    }

    const candidatesResult = await db.query(
      `SELECT
         ci.candidate_name,
         ci.candidate_email,
         a.id AS assessment_id,
         ci.completed_at,
         a.total_score AS final_score,
         json_object_agg(car.skill_category, car.final_score) AS skill_scores
       FROM candidate_invites ci
       JOIN assessments a ON ci.assessment_id = a.id
       JOIN combined_assessment_results car ON car.assessment_id = a.id
       WHERE ci.organization_id = $1
         AND ci.status = 'completed'
         AND (a.assessment_type = 'base' OR a.assessment_type IS NULL)
         AND ci.focus_config_id IS NULL
       GROUP BY ci.candidate_name, ci.candidate_email, a.id, ci.completed_at, a.total_score
       ORDER BY ci.completed_at DESC`,
      [orgId]
    );

    const candidates = candidatesResult.rows;

    if (candidates.length < 3) {
      return res.status(400).json({
        success: false,
        message: `Servono almeno 3 candidati con assessment base completato. Attualmente: ${candidates.length}.`,
        count: candidates.length,
      });
    }

    const orgResult = await db.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
    const orgName = orgResult.rows[0]?.name || 'Organizzazione';

    const candidateSummaries = candidates.map(c => {
      const scores = c.skill_scores || {};
      const skillLines = Object.entries(SKILL_LABELS)
        .map(([key, label]) => `  - ${label}: ${scores[key] != null ? Number(scores[key]).toFixed(2) : 'N/D'}`)
        .join('\n');
      return `Candidato: ${c.candidate_name || c.candidate_email}
Punteggio generale: ${Number(c.final_score).toFixed(2)}/5.0
Competenze:\n${skillLines}`;
    }).join('\n\n---\n\n');

    const prompt = `Sei un esperto HR che analizza i profili di competenze soft skill di un team aziendale.

Organizzazione: ${orgName}
Numero candidati analizzati: ${candidates.length}

Di seguito i profili individuali (scala ESCO 1-5):
- 4.1-5.0: Esperto
- 3.1-4.0: Avanzato
- 2.1-3.0: Intermedio
- 1.0-2.0: Base

${candidateSummaries}

Genera un'analisi aggregata del team in italiano. Rispondi SOLO con un oggetto JSON valido, senza testo aggiuntivo, con questa struttura:
{
  "summary": "Paragrafo di 3-5 frasi che descrive il profilo complessivo del team, il livello medio e le caratteristiche distintive.",
  "strengths": [
    { "skill": "chiave_inglese_esatta", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase sulla forza di questa competenza nel team." },
    { "skill": "chiave_inglese_esatta", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." },
    { "skill": "chiave_inglese_esatta", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." }
  ],
  "gaps": [
    { "skill": "chiave_inglese_esatta", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase sul gap e possibile impatto." },
    { "skill": "chiave_inglese_esatta", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." },
    { "skill": "chiave_inglese_esatta", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." }
  ],
  "outliers": "Paragrafo su eventuali profili anomali (molto sopra o sotto la media del team), o null se non ci sono outlier significativi.",
  "recommendation": "Paragrafo di 3-4 frasi con raccomandazioni concrete per l'HR su come sviluppare le aree di gap e valorizzare i punti di forza del team."
}

Le chiavi inglesi per "skill" devono essere esattamente una di: communication, leadership, problem_solving, teamwork, time_management, adaptability, creativity, critical_thinking, empathy, resilience, negotiation, decision_making.
Per strengths e gaps, scegli le 3 competenze con media più alta (strengths) e più bassa (gaps) tra le 12. I valori avg_score devono essere calcolati come media reale sui candidati forniti.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const rawContent = response.content[0].text.trim();

    let reportData;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      reportData = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, rawContent);
      return res.status(500).json({ success: false, message: 'Errore nel parsing della risposta AI' });
    }

    // Costruisce candidate_scores per le 6 skill identificate (3 strengths + 3 gaps)
    const featuredSkills = [
      ...(reportData.strengths || []).map(s => s.skill),
      ...(reportData.gaps || []).map(g => g.skill),
    ].filter(Boolean);

    reportData.candidate_scores = candidates.map(c => {
      const scores = c.skill_scores || {};
      const entry = { name: c.candidate_name || c.candidate_email, scores: {} };
      for (const skillKey of featuredSkills) {
        const label = SKILL_LABELS[skillKey] || skillKey;
        entry.scores[label] = scores[skillKey] != null ? Number(Number(scores[skillKey]).toFixed(2)) : null;
      }
      return entry;
    });

    const upsertResult = await db.query(
      `INSERT INTO team_reports (organization_id, candidate_count, report_data, generated_at, generated_by)
       VALUES ($1, $2, $3, NOW(), $4)
       ON CONFLICT (organization_id)
       DO UPDATE SET
         candidate_count = EXCLUDED.candidate_count,
         report_data = EXCLUDED.report_data,
         generated_at = NOW(),
         generated_by = EXCLUDED.generated_by
       RETURNING *`,
      [orgId, candidates.length, JSON.stringify(reportData), userId]
    );

    res.json({ success: true, report: upsertResult.rows[0] });
  } catch (err) {
    console.error('POST /team-reports/:orgId/generate error:', err);
    res.status(500).json({ success: false, message: 'Errore nella generazione del report' });
  }
});

// ── GET /api/team-reports/:orgId/pdf ─────────────────────────────────────────
router.get('/:orgId/pdf', verifyToken, async (req, res, next) => {
  const { orgId } = req.params;
  const userId = req.user.supabase_id ?? req.user.id;
  let browser;

  try {
    const membership = await db.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Accesso non autorizzato' });
    }

    const reportResult = await db.query(
      'SELECT * FROM team_reports WHERE organization_id = $1',
      [orgId]
    );
    if (reportResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Nessun report generato' });
    }

    const report = reportResult.rows[0];
    const orgResult = await db.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
    const orgName = orgResult.rows[0]?.name || 'Organizzazione';
    const data = report.report_data;

    const generatedDate = new Date(report.generated_at).toLocaleDateString('it-IT', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    const barHtml = (items) => items.map(item => {
      const v = Number(item.avg_score);
      const pct = Math.round((v / 5) * 100);
      const esco = escoLevel(v);
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
            <span style="font-size:13px;font-weight:600;color:#1C1917;">${item.label}</span>
            <span style="font-size:12px;color:#1C1917;font-family:monospace;">${v.toFixed(2)} · ${esco.label}</span>
          </div>
          <div style="background:#E8E0D0;border-radius:3px;height:10px;">
            <div style="width:${pct}%;background:${esco.color};border-radius:3px;height:10px;"></div>
          </div>
          ${item.note ? `<p style="font-size:11px;color:#6B6560;margin:4px 0 0;">${item.note}</p>` : ''}
        </div>`;
    }).join('');

    const candidateScoresHtml = (data.candidate_scores && data.candidate_scores.length > 0) ? (() => {
      const skillLabels = data.candidate_scores.length > 0 ? Object.keys(data.candidate_scores[0].scores) : [];
      const rows = data.candidate_scores.map(c => {
        const cells = skillLabels.map(label => {
          const v = c.scores[label];
          if (v == null) return '<td style="padding:6px 8px;text-align:center;font-size:11px;color:#aaa;">N/D</td>';
          const esco = escoLevel(v);
          return `<td style="padding:6px 8px;text-align:center;font-size:11px;font-family:monospace;font-weight:600;background:${esco.color};color:#fff;border-radius:3px;">${v.toFixed(2)}</td>`;
        }).join('');
        return `<tr><td style="padding:6px 10px;font-size:12px;font-weight:500;color:#1C1917;white-space:nowrap;">${c.name}</td>${cells}</tr>`;
      }).join('');
      const headers = skillLabels.map(l => `<th style="padding:6px 8px;font-size:10px;text-transform:uppercase;color:#6B6560;letter-spacing:.05em;text-align:center;">${l}</th>`).join('');
      return `
        <div style="background:#FAF7F2;border:1px solid #D4CBBA;border-radius:6px;padding:20px;margin-bottom:20px;">
          <p style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6B6560;margin:0 0 14px;">Mappa del Team</p>
          <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:separate;border-spacing:3px;">
              <thead><tr><th style="padding:6px 10px;text-align:left;font-size:10px;color:#6B6560;"></th>${headers}</tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    })() : '';

    const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #F5F0E8; color: #1C1917; font-size: 13px; }
  .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm 16mm; background: #F5F0E8; position: relative; }
  .page-break { page-break-before: always; }
  .footer { position: fixed; bottom: 10mm; left: 14mm; right: 14mm; font-size: 10px; color: #9C9590; border-top: 1px solid #D4CBBA; padding-top: 5px; display: flex; justify-content: space-between; }
  .section { background: #FAF7F2; border: 1px solid #D4CBBA; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
  .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #6B6560; margin-bottom: 14px; }
  .section-body { font-size: 13px; color: #1C1917; line-height: 1.6; }
  .recommendation { background: #FAF7F2; border-left: 4px solid #B5541A; border-radius: 0 6px 6px 0; padding: 20px; margin-bottom: 20px; }
  .recommendation .section-label { color: #B5541A; }
</style>
</head>
<body>

<div class="page">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #1C1917;">
    <div>
      <div style="font-size:20px;font-weight:800;letter-spacing:-.5px;color:#1C1917;margin-bottom:4px;">Valuto<span style="color:#B5541A;">Lab</span></div>
      <div style="font-size:10px;color:#6B6560;text-transform:uppercase;letter-spacing:.08em;">Report di Team — Riservato</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:700;color:#1C1917;">${orgName}</div>
      <div style="font-size:11px;color:#6B6560;margin-top:2px;">Generato il ${generatedDate}</div>
      <div style="font-size:11px;color:#6B6560;">Basato su <strong>${report.candidate_count}</strong> candidati</div>
    </div>
  </div>

  <!-- Sintesi -->
  <div class="section">
    <p class="section-label">Sintesi</p>
    <p class="section-body">${data.summary || ''}</p>
  </div>

  <!-- Punti di Forza -->
  ${data.strengths && data.strengths.length > 0 ? `
  <div class="section">
    <p class="section-label">Punti di Forza</p>
    ${barHtml(data.strengths)}
  </div>` : ''}

  <!-- Aree di Sviluppo -->
  ${data.gaps && data.gaps.length > 0 ? `
  <div class="section">
    <p class="section-label">Aree di Sviluppo</p>
    ${barHtml(data.gaps)}
  </div>` : ''}
</div>

<div class="page page-break">
  <!-- Mappa del Team -->
  ${candidateScoresHtml}

  <!-- Profili in Evidenza -->
  ${data.outliers ? `
  <div class="section">
    <p class="section-label">Profili in Evidenza</p>
    <p class="section-body">${data.outliers}</p>
  </div>` : ''}

  <!-- Raccomandazione HR -->
  ${data.recommendation ? `
  <div class="recommendation">
    <p class="section-label">Raccomandazione HR</p>
    <p class="section-body">${data.recommendation}</p>
  </div>` : ''}
</div>

<div class="footer">
  <span>ValutoLab · Report riservato</span>
  <span>valutolab.com</span>
</div>

</body>
</html>`;

    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await browser.close();
    browser = null;

    const safeName = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const dateStr = new Date().toISOString().slice(0, 10);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-team-${safeName}-${dateStr}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (err) {
    if (browser) { try { await browser.close(); } catch (_) {} }
    next(err);
  }
});

export default router;
