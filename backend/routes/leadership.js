const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ============================================
// GET /api/leadership/questions
// Restituisce le 30 domande del Leadership Assessment
// ============================================
router.get('/questions', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const questionsPath = path.join(__dirname, '../data/leadership_questions.json');
    const questionsData = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
    
    res.json({
      success: true,
      data: questionsData.leadership_assessment
    });
  } catch (error) {
    console.error('Error loading leadership questions:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel caricamento delle domande'
    });
  }
});

// ============================================
// POST /api/leadership/start
// Crea un nuovo Leadership Assessment
// ============================================
router.post('/start', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID richiesto'
      });
    }

    // Crea nuovo assessment
    const { data: assessment, error } = await supabase
      .from('leadership_assessments')
      .insert({
        user_id: userId,
        status: 'in_progress'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    console.error('Error starting leadership assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'assessment'
    });
  }
});

// ============================================
// POST /api/leadership/:assessmentId/response
// Salva una risposta
// ============================================
router.post('/:assessmentId/response', async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { questionId, dimension, answer, score } = req.body;

    // Validazione
    if (!questionId || !dimension || !answer || !score) {
      return res.status(400).json({
        success: false,
        message: 'Dati mancanti'
      });
    }

    // Salva risposta (upsert per permettere modifica)
    const { data, error } = await supabase
      .from('leadership_responses')
      .upsert({
        assessment_id: assessmentId,
        question_id: questionId,
        dimension: dimension,
        answer: answer,
        score: score
      }, {
        onConflict: 'assessment_id,question_id'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      response: data
    });
  } catch (error) {
    console.error('Error saving leadership response:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel salvataggio della risposta'
    });
  }
});

// ============================================
// GET /api/leadership/:assessmentId/progress
// Restituisce il progresso dell'assessment
// ============================================
router.get('/:assessmentId/progress', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Conta risposte salvate
    const { count, error } = await supabase
      .from('leadership_responses')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessmentId);

    if (error) throw error;

    const totalQuestions = 30;
    const answeredCount = count || 0;
    const progress = Math.round((answeredCount / totalQuestions) * 100);

    res.json({
      success: true,
      progress: {
        answeredCount,
        totalQuestions,
        percentage: progress
      }
    });
  } catch (error) {
    console.error('Error getting leadership progress:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del progresso'
    });
  }
});

// ============================================
// POST /api/leadership/:assessmentId/calculate
// Calcola i risultati e genera report AI
// ============================================
router.post('/:assessmentId/calculate', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // 1. Recupera tutte le risposte
    const { data: responses, error: responsesError } = await supabase
      .from('leadership_responses')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (responsesError) throw responsesError;

    if (!responses || responses.length !== 30) {
      return res.status(400).json({
        success: false,
        message: 'Assessment incompleto'
      });
    }

    // 2. Calcola score per dimensione
    const dimensions = [
      'visione_strategica',
      'people_management',
      'decisionalita',
      'change_management',
      'influenza_persuasione',
      'orientamento_risultati'
    ];

    const dimensionNames = {
      visione_strategica: 'Visione Strategica',
      people_management: 'People Management',
      decisionalita: 'Decisionalità',
      change_management: 'Change Management',
      influenza_persuasione: 'Influenza & Persuasione',
      orientamento_risultati: 'Orientamento ai Risultati'
    };

    const results = [];
    let totalScore = 0;

    for (const dimension of dimensions) {
      const dimensionResponses = responses.filter(r => r.dimension === dimension);
      const dimensionScore = dimensionResponses.reduce((sum, r) => sum + r.score, 0) / dimensionResponses.length;
      
      totalScore += dimensionScore;

      results.push({
        dimension,
        dimension_name: dimensionNames[dimension],
        score: dimensionScore.toFixed(2)
      });
    }

    const averageScore = (totalScore / dimensions.length).toFixed(2);

    // 3. Salva risultati nel database
    for (const result of results) {
      await supabase
        .from('leadership_results')
        .upsert({
          assessment_id: assessmentId,
          dimension: result.dimension,
          dimension_name: result.dimension_name,
          score: result.score
        }, {
          onConflict: 'assessment_id,dimension'
        });
    }

    // 4. Genera report AI con Claude
    const aiReport = await generateLeadershipReport(assessmentId, results, responses);

    // 5. Aggiorna assessment status
    await supabase
      .from('leadership_assessments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_score: averageScore
      })
      .eq('id', assessmentId);

    res.json({
      success: true,
      results: {
        totalScore: averageScore,
        dimensions: results,
        aiReport
      }
    });
  } catch (error) {
    console.error('Error calculating leadership results:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel calcolo dei risultati'
    });
  }
});

// ============================================
// FUNZIONE: Genera Report AI Leadership
// ============================================
async function generateLeadershipReport(assessmentId, results, responses) {
  try {
    // Prepara dati per Claude
    const dimensionsText = results
      .map(r => `${r.dimension_name}: ${r.score}/5.0`)
      .join('\n');

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
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    // Parse risposta JSON da Claude
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const aiData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!aiData) {
      throw new Error('Invalid AI response format');
    }

    // Salva report AI nel database
    const { data: report, error } = await supabase
      .from('leadership_ai_reports')
      .insert({
        assessment_id: assessmentId,
        leadership_style: aiData.leadership_style,
        style_description: aiData.style_description,
        key_strengths: aiData.key_strengths,
        development_areas: aiData.development_areas,
        action_plan: aiData.action_plan
      })
      .select()
      .single();

    if (error) throw error;

    return report;
  } catch (error) {
    console.error('Error generating AI report:', error);
    return null;
  }
}

// ============================================
// GET /api/leadership/:assessmentId/results
// Recupera i risultati completi
// ============================================
router.get('/:assessmentId/results', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Recupera assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('leadership_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    // Recupera risultati dimensioni
    const { data: results, error: resultsError } = await supabase
      .from('leadership_results')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('score', { ascending: false });

    if (resultsError) throw resultsError;

    // Recupera report AI
    const { data: aiReport, error: reportError } = await supabase
      .from('leadership_ai_reports')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single();

    // Non lanciare errore se report non esiste (potrebbe essere in generazione)

    res.json({
      success: true,
      data: {
        assessment,
        results,
        aiReport: aiReport || null
      }
    });
  } catch (error) {
    console.error('Error fetching leadership results:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei risultati'
    });
  }
});

module.exports = router;
