import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Helper function per formattare nomi categorie
function formatCategoryName(category) {
  const categoryMap = {
    'communication': 'Comunicazione',
    'leadership': 'Leadership',
    'problem_solving': 'Problem Solving',
    'teamwork': 'Lavoro di Squadra',
    'time_management': 'Gestione del Tempo',
    'adaptability': 'Adattabilità',
    'emotional_intelligence': 'Intelligenza Emotiva',
    'creativity': 'Creatività',
    'critical_thinking': 'Pensiero Critico',
    'empathy': 'Empatia',
    'negotiation': 'Negoziazione',
    'resilience': 'Resilienza'
  };
  return categoryMap[category] || category;
}

// POST /api/share/create - Crea condivisione profilo
router.post('/create', async (req, res) => {
  try {
    const { userId, assessmentId } = req.body;

    if (!userId || !assessmentId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId e assessmentId sono obbligatori' 
      });
    }

    // Verifica che l'assessment esista e appartenga all'utente
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, user_id, status')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({ 
        success: false, 
        error: 'Assessment non trovato o non completato' 
      });
    }

    // Verifica se esiste già una condivisione per questo assessment
    const { data: existingShare } = await supabase
      .from('shared_profiles')
      .select('*')
      .eq('assessment_id', assessmentId)
      .single();

    if (existingShare) {
      // Riattiva se era disattivata
      if (!existingShare.is_active) {
        const { data: updated, error: updateError } = await supabase
          .from('shared_profiles')
          .update({ is_active: true })
          .eq('id', existingShare.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return res.json({ 
          success: true, 
          share: updated,
          message: 'Condivisione riattivata'
        });
      }

      return res.json({ 
        success: true, 
        share: existingShare,
        message: 'Condivisione già esistente'
      });
    }

    // Crea nuova condivisione
    const { data: newShare, error: createError } = await supabase
      .from('shared_profiles')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        is_active: true
      })
      .select()
      .single();

    if (createError) throw createError;

    res.json({ 
      success: true, 
      share: newShare,
      message: 'Condivisione creata con successo'
    });

  } catch (error) {
    console.error('Error creating share:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/share/:token - Ottieni profilo pubblico
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    // Trova condivisione attiva
    const { data: share, error: shareError } = await supabase
      .from('shared_profiles')
      .select(`
        *,
        assessments!inner(
          id,
          total_score,
          completed_at,
          user_id
        )
      `)
      .eq('share_token', token)
      .eq('is_active', true)
      .single();

    if (shareError || !share) {
      return res.status(404).json({ 
        success: false, 
        error: 'Profilo non trovato o condivisione disattivata' 
      });
    }

    // Ottieni profilo utente
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', share.assessments.user_id)
      .single();

    // Ottieni risultati assessment con colonne corrette
    const { data: results } = await supabase
      .from('combined_assessment_results')
      .select('skill_category, final_score')
      .eq('assessment_id', share.assessment_id);

    // Mappa i risultati nel formato atteso dal frontend
    const mappedResults = results ? results.map(r => ({
      category: formatCategoryName(r.skill_category),
      score: Math.round(parseFloat(r.final_score) * 20) // Converte da 0-5 a 0-100
    })) : [];

    // Incrementa view count
    await supabase
      .from('shared_profiles')
      .update({ 
        view_count: share.view_count + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', share.id);

    res.json({
      success: true,
      profile: {
        name: profile?.full_name || 'Utente ValutoLab',
        completedAt: share.assessments.completed_at,
        totalScore: share.assessments.total_score,
        results: mappedResults
      }
    });

  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/share/:token/toggle - Attiva/disattiva condivisione
router.put('/:token/toggle', async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body;

    // Trova condivisione dell'utente
    const { data: share, error: findError } = await supabase
      .from('shared_profiles')
      .select('*')
      .eq('share_token', token)
      .eq('user_id', userId)
      .single();

    if (findError || !share) {
      return res.status(404).json({ 
        success: false, 
        error: 'Condivisione non trovata' 
      });
    }

    // Toggle is_active
    const { data: updated, error: updateError } = await supabase
      .from('shared_profiles')
      .update({ is_active: !share.is_active })
      .eq('id', share.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ 
      success: true, 
      share: updated,
      message: updated.is_active ? 'Condivisione attivata' : 'Condivisione disattivata'
    });

  } catch (error) {
    console.error('Error toggling share:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/share/:token - Elimina condivisione
router.delete('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { userId } = req.body;

    const { error } = await supabase
      .from('shared_profiles')
      .delete()
      .eq('share_token', token)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'Condivisione eliminata con successo'
    });

  } catch (error) {
    console.error('Error deleting share:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
