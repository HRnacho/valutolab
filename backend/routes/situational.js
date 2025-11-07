import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /api/situational-questions
 * Recupera tutte le domande situazionali attive
 */
router.get('/situational-questions', async (req, res) => {
  try {
    const { data: questions, error } = await supabase
      .from('situational_questions')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching situational questions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch situational questions'
      });
    }

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Error in situational-questions endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/situational-responses
 * Salva le risposte dell'utente alle domande situazionali
 * 
 * Body: {
 *   assessmentId: UUID,
 *   userId: UUID,
 *   responses: [
 *     {
 *       questionId: UUID,
 *       selectedOption: 'A' | 'B' | 'C' | 'D'
 *     }
 *   ]
 * }
 */
router.post('/situational-responses', async (req, res) => {
  try {
    const { assessmentId, userId, responses } = req.body;

    if (!assessmentId || !userId || !responses || !Array.isArray(responses)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assessmentId, userId, responses'
      });
    }

    // Per ogni risposta, dobbiamo recuperare i pesi dalla domanda
    const responsesToInsert = [];

    for (const response of responses) {
      const { questionId, selectedOption } = response;

      // Recupera la domanda per ottenere i pesi dell'opzione selezionata
      const { data: question, error: questionError } = await supabase
        .from('situational_questions')
        .select('options')
        .eq('id', questionId)
        .single();

      if (questionError || !question) {
        console.error(`Error fetching question ${questionId}:`, questionError);
        continue;
      }

      // Trova l'opzione selezionata e i suoi pesi
      const selectedOptionData = question.options.find(opt => opt.label === selectedOption);

      if (!selectedOptionData) {
        console.error(`Option ${selectedOption} not found for question ${questionId}`);
        continue;
      }

      responsesToInsert.push({
        assessment_id: assessmentId,
        user_id: userId,
        question_id: questionId,
        selected_option: selectedOption,
        skill_weights: selectedOptionData.skill_weights
      });
    }

    // Inserisci tutte le risposte (upsert per gestire aggiornamenti)
    const { data: savedResponses, error: insertError } = await supabase
      .from('situational_responses')
      .upsert(responsesToInsert, {
        onConflict: 'assessment_id,question_id'
      })
      .select();

    if (insertError) {
      console.error('Error saving situational responses:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save responses'
      });
    }

    res.json({
      success: true,
      saved: savedResponses.length
    });
  } catch (error) {
    console.error('Error in situational-responses endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/assessments/:assessmentId/results-combined
 * Recupera i risultati combinati (Likert + SJT) con weighted blend
 */
router.get('/assessments/:assessmentId/results-combined', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    // Usa la vista combined_assessment_results
    const { data: results, error } = await supabase
      .from('combined_assessment_results')
      .select('*')
      .eq('assessment_id', assessmentId)
      .order('final_score', { ascending: false });

    if (error) {
      console.error('Error fetching combined results:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch combined results'
      });
    }

    // Calcola il punteggio generale (media dei final_score)
    const totalScore = results.reduce((sum, r) => sum + parseFloat(r.final_score), 0) / results.length;

    res.json({
      success: true,
      results,
      totalScore: parseFloat(totalScore.toFixed(2))
    });
  } catch (error) {
    console.error('Error in results-combined endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/assessments/:assessmentId/situational-responses
 * Recupera le risposte situazionali per un assessment
 */
router.get('/assessments/:assessmentId/situational-responses', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data: responses, error } = await supabase
      .from('situational_responses')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (error) {
      console.error('Error fetching situational responses:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch responses'
      });
    }

    res.json({
      success: true,
      responses
    });
  } catch (error) {
    console.error('Error in situational-responses GET endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;