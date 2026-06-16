import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
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

// GET /api/team-reports/:orgId — restituisce il report salvato (se esiste)
router.get('/:orgId', verifyToken, async (req, res) => {
  const { orgId } = req.params;
  const userId = req.user.supabase_id ?? req.user.id;

  try {
    // Verifica che l'utente sia membro dell'org
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

// POST /api/team-reports/:orgId/generate — genera o rigenera il report AI
router.post('/:orgId/generate', verifyToken, async (req, res) => {
  const { orgId } = req.params;
  const userId = req.user.supabase_id ?? req.user.id;

  try {
    // Verifica membership
    const membership = await db.query(
      'SELECT id FROM organization_members WHERE organization_id = $1 AND user_id = $2',
      [orgId, userId]
    );
    if (membership.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Accesso non autorizzato' });
    }

    // Recupera candidati base completati con punteggi aggregati per skill
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

    // Recupera nome organizzazione
    const orgResult = await db.query('SELECT name FROM organizations WHERE id = $1', [orgId]);
    const orgName = orgResult.rows[0]?.name || 'Organizzazione';

    // Costruisce il prompt
    const candidateSummaries = candidates.map(c => {
      const scores = c.skill_scores || {};
      const skillLines = Object.entries(SKILL_LABELS)
        .map(([key, label]) => `  - ${label}: ${scores[key] != null ? Number(scores[key]).toFixed(2) : 'N/D'}`)
        .join('\n');
      return `Candidato: ${c.candidate_name || c.candidate_email}
Punteggio generale: ${Number(c.final_score).toFixed(2)}/5.0
Competenze:
${skillLines}`;
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
    { "skill": "nome_skill_inglese", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase sulla forza di questa competenza nel team." },
    { "skill": "nome_skill_inglese", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." },
    { "skill": "nome_skill_inglese", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." }
  ],
  "gaps": [
    { "skill": "nome_skill_inglese", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase sul gap e possibile impatto." },
    { "skill": "nome_skill_inglese", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." },
    { "skill": "nome_skill_inglese", "label": "Nome in italiano", "avg_score": 0.00, "note": "Una frase." }
  ],
  "outliers": "Paragrafo su eventuali profili anomali (molto sopra o sotto la media del team), o null se non ci sono outlier significativi.",
  "recommendation": "Paragrafo di 3-4 frasi con raccomandazioni concrete per l'HR su come sviluppare le aree di gap e valorizzare i punti di forza del team."
}

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

    // UPSERT — un report per organizzazione
    const upsertResult = await db.query(
      `INSERT INTO team_reports (organization_id, candidate_count, report_data, generated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (organization_id)
       DO UPDATE SET
         candidate_count = EXCLUDED.candidate_count,
         report_data = EXCLUDED.report_data,
         generated_at = NOW()
       RETURNING *`,
      [orgId, candidates.length, JSON.stringify(reportData)]
    );

    res.json({ success: true, report: upsertResult.rows[0] });
  } catch (err) {
    console.error('POST /team-reports/:orgId/generate error:', err);
    res.status(500).json({ success: false, message: 'Errore nella generazione del report' });
  }
});

export default router;
