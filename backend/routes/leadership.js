import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Carica le domande una sola volta in memoria
const questionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/leadership_questions.json'), 'utf8')
);
// Mappa question_id → { dimension, pesi } per il calcolo
const questionsMap = {};
questionsData.leadership_assessment.questions.forEach(q => {
  questionsMap[q.id] = { dimension: q.dimension, pesi: q.pesi };
});

// GET /api/leadership/questions
router.get('/questions', (req, res) => {
  res.json({ success: true, data: questionsData.leadership_assessment });
});

// POST /api/leadership/start
router.post('/start', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID richiesto' });
    }

    const { rows } = await db.query(
      `INSERT INTO leadership_assessments (user_id, status)
       VALUES ($1, 'in_progress')
       RETURNING *`,
      [userId]
    );

    res.json({ success: true, assessment: rows[0] });
  } catch (error) {
    console.error('Error starting leadership assessment:', error);
    res.status(500).json({ success: false, message: "Errore nella creazione dell'assessment" });
  }
});

// POST /api/leadership/:assessmentId/response
// Frontend invia { questionId, dimension, answer, score } ma la tabella locale
// salva solo question_id e answer (A/B/C/D) — dimension e score vengono dal JSON
router.post('/:assessmentId/response', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || !answer) {
      return res.status(400).json({ success: false, message: 'Dati mancanti' });
    }

    const { rows } = await db.query(
      `INSERT INTO leadership_responses (assessment_id, question_id, answer)
       VALUES ($1, $2, $3)
       ON CONFLICT (assessment_id, question_id) DO UPDATE SET answer = EXCLUDED.answer
       RETURNING *`,
      [assessmentId, questionId, answer]
    );

    res.json({ success: true, response: rows[0] });
  } catch (error) {
    console.error('Error saving leadership response:', error);
    res.status(500).json({ success: false, message: 'Errore nel salvataggio della risposta' });
  }
});

// GET /api/leadership/:assessmentId/progress
router.get('/:assessmentId/progress', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { rows } = await db.query(
      'SELECT COUNT(*) AS count FROM leadership_responses WHERE assessment_id = $1',
      [assessmentId]
    );

    const answeredCount  = parseInt(rows[0].count);
    const totalQuestions = 30;

    res.json({
      success: true,
      progress: {
        answeredCount,
        totalQuestions,
        percentage: Math.round((answeredCount / totalQuestions) * 100)
      }
    });
  } catch (error) {
    console.error('Error getting leadership progress:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero del progresso' });
  }
});

// POST /api/leadership/:assessmentId/calculate
router.post('/:assessmentId/calculate', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { rows: responses } = await db.query(
      'SELECT question_id, answer FROM leadership_responses WHERE assessment_id = $1',
      [assessmentId]
    );

    if (!responses || responses.length !== 30) {
      return res.status(400).json({
        success: false,
        message: `Assessment incompleto: ${responses?.length || 0}/30 risposte`
      });
    }

    // Ricostruisce score e dimension dal JSON delle domande
    const enriched = responses.map(r => {
      const q = questionsMap[r.question_id];
      if (!q) throw new Error(`Domanda non trovata: ${r.question_id}`);
      return {
        question_id: r.question_id,
        dimension:   q.dimension,
        score:       q.pesi[r.answer] ?? 0
      };
    });

    const dimensions = [
      'visione_strategica', 'people_management', 'decisionalita',
      'change_management', 'influenza_persuasione', 'orientamento_risultati'
    ];
    const dimensionNames = {
      visione_strategica:     'Visione Strategica',
      people_management:      'People Management',
      decisionalita:          'Decisionalità',
      change_management:      'Change Management',
      influenza_persuasione:  'Influenza & Persuasione',
      orientamento_risultati: 'Orientamento ai Risultati'
    };

    let totalScore = 0;
    const results = dimensions.map(dim => {
      const dimResponses = enriched.filter(r => r.dimension === dim);
      const score = dimResponses.length > 0
        ? dimResponses.reduce((sum, r) => sum + r.score, 0) / dimResponses.length
        : 0;
      totalScore += score;
      return { dimension: dim, dimension_name: dimensionNames[dim], score: parseFloat(score.toFixed(2)) };
    });

    const averageScore = parseFloat((totalScore / dimensions.length).toFixed(2));

    // Salva risultati per dimensione (UPSERT)
    for (const result of results) {
      await db.query(
        `INSERT INTO leadership_results (assessment_id, dimension, dimension_name, score)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assessment_id, dimension) DO UPDATE
           SET dimension_name = EXCLUDED.dimension_name, score = EXCLUDED.score`,
        [assessmentId, result.dimension, result.dimension_name, result.score]
      );
    }

    // Genera report AI (logica invariata)
    const aiReport = await generateLeadershipReport(assessmentId, results, enriched);

    // Segna assessment come completato
    await db.query(
      `UPDATE leadership_assessments
       SET status = 'completed', completed_at = NOW(), total_score = $1
       WHERE id = $2`,
      [averageScore, assessmentId]
    );

    res.json({
      success: true,
      results: { totalScore: averageScore, dimensions: results, aiReport }
    });
  } catch (error) {
    console.error('Error calculating leadership results:', error);
    res.status(500).json({ success: false, message: 'Errore nel calcolo dei risultati' });
  }
});

// GET /api/leadership/:assessmentId/results
router.get('/:assessmentId/results', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { rows: assessmentRows } = await db.query(
      'SELECT * FROM leadership_assessments WHERE id = $1',
      [assessmentId]
    );
    if (assessmentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment non trovato' });
    }

    const { rows: results } = await db.query(
      'SELECT * FROM leadership_results WHERE assessment_id = $1 ORDER BY score DESC',
      [assessmentId]
    );

    const { rows: aiReportRows } = await db.query(
      'SELECT * FROM leadership_ai_reports WHERE assessment_id = $1 LIMIT 1',
      [assessmentId]
    );

    res.json({
      success: true,
      data: {
        assessment: assessmentRows[0],
        results,
        aiReport: aiReportRows[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching leadership results:', error);
    res.status(500).json({ success: false, message: 'Errore nel recupero dei risultati' });
  }
});

// ── Generazione report AI (logica invariata, solo storage migrato) ─────────────
async function generateLeadershipReport(assessmentId, results) {
  try {
    const dimensionsText = results.map(r => `${r.dimension_name}: ${r.score}/5.0`).join('\n');

    const prompt = `Sei un esperto di leadership e organizational development. Analizza i risultati di questo Leadership Assessment e genera un report dettagliato.

PUNTEGGI PER DIMENSIONE:
${dimensionsText}

COMPITO:
1. Identifica lo STILE DI LEADERSHIP predominante (scegli tra: Trasformazionale, Transazionale, Servant, Democratico, Autocratico, Coaching, Visionario, o una combinazione)

2. Descrivi lo stile in 2-3 paragrafi, spiegando:
   - Caratteristiche principali
   - Come si manifesta nel contesto lavorativo
   - Vantaggi e sfide di questo stile

3. Identifica i 3 PUNTI DI FORZA principali basandoti sui punteggi più alti

4. Identifica le 2 AREE DI SVILUPPO principali basandoti sui punteggi più bassi

5. Proponi un PIANO D'AZIONE concreto con:
   - 3 azioni immediate (entro 1 mese)
   - 3 obiettivi a medio termine (3-6 mesi)
   - Risorse/libri consigliati

Usa un tono professionale ma accessibile. Sii specifico e pratico.

FORMATO RISPOSTA (JSON):
{
  "leadership_style": "Nome dello stile",
  "style_description": "Descrizione dettagliata...",
  "key_strengths": "Descrizione dei 3 punti di forza...",
  "development_areas": "Descrizione delle 2 aree di sviluppo...",
  "action_plan": {
    "immediate_actions": ["azione 1", "azione 2", "azione 3"],
    "medium_term_goals": ["obiettivo 1", "obiettivo 2", "obiettivo 3"],
    "recommended_resources": ["risorsa 1", "risorsa 2", "risorsa 3"]
  }
}`;

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }]
    });

    const jsonMatch = message.content[0].text.match(/\{[\s\S]*\}/);
    const aiData    = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    if (!aiData) throw new Error('Invalid AI response format');

    const { rows } = await db.query(
      `INSERT INTO leadership_ai_reports
         (assessment_id, leadership_style, style_description, key_strengths, development_areas, action_plan)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (assessment_id) DO UPDATE SET
         leadership_style  = EXCLUDED.leadership_style,
         style_description = EXCLUDED.style_description,
         key_strengths     = EXCLUDED.key_strengths,
         development_areas = EXCLUDED.development_areas,
         action_plan       = EXCLUDED.action_plan
       RETURNING *`,
      [assessmentId, aiData.leadership_style, aiData.style_description,
       aiData.key_strengths, aiData.development_areas, JSON.stringify(aiData.action_plan)]
    );

    return rows[0];
  } catch (error) {
    console.error('Error generating AI report:', error);
    return null;
  }
}

export default router;
