import express from 'express';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcrypt';

const router = express.Router();

// ============================================
// ENDPOINT ESISTENTI (MANTENUTI)
// ============================================

/**
 * GET /api/admin/stats
 * Statistiche dashboard admin
 */
router.get('/stats', async (req, res) => {
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const { data: assessments } = await supabase
      .from('assessments')
      .select('status, created_at, completed_at');

    const completed = assessments?.filter(a => a.status === 'completed').length || 0;
    const inProgress = assessments?.filter(a => a.status === 'in_progress').length || 0;
    const abandoned = assessments?.filter(a => a.status === 'abandoned').length || 0;

    // Nuovi utenti ultimi 7 giorni
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = authUsers?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0;

    // Assessment completati ultimi 7 giorni
    const completedLast7Days = assessments?.filter(a => 
      a.status === 'completed' && 
      a.completed_at && 
      new Date(a.completed_at) > sevenDaysAgo
    ).length || 0;

    // Tempo medio completamento (in minuti)
    const completedWithTime = assessments?.filter(a => a.status === 'completed' && a.created_at && a.completed_at) || [];
    let avgCompletionTime = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, a) => {
        const start = new Date(a.created_at);
        const end = new Date(a.completed_at);
        return sum + (end - start) / (1000 * 60); // minuti
      }, 0);
      avgCompletionTime = Math.round(totalTime / completedWithTime.length);
    }

    const { data: avgScores } = await supabase
      .from('combined_assessment_results')
      .select('skill_category, final_score');

    const categoryAverages = {};
    if (avgScores) {
      avgScores.forEach(score => {
        if (!categoryAverages[score.skill_category]) {
          categoryAverages[score.skill_category] = { total: 0, count: 0 };
        }
        categoryAverages[score.skill_category].total += parseFloat(score.final_score);
        categoryAverages[score.skill_category].count += 1;
      });
      Object.keys(categoryAverages).forEach(key => {
        categoryAverages[key] = (categoryAverages[key].total / categoryAverages[key].count).toFixed(2);
      });
    }

    res.json({
      success: true,
      stats: {
        totalUsers: authUsers?.length || 0,
        totalAssessments: assessments?.length || 0,
        completedAssessments: completed,
        inProgressAssessments: inProgress,
        abandonedAssessments: abandoned,
        avgCompletionTime: avgCompletionTime,
        newUsersLast7Days: newUsersLast7Days,
        completedLast7Days: completedLast7Days,
        categoryAverages
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/users
 * Lista utenti con dettagli
 */
router.get('/users', async (req, res) => {
  try {
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;

    const usersWithStats = await Promise.all(authUsers.map(async (user) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name, is_blocked')
        .eq('id', user.id)
        .single();

      const { count: assessmentCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Ultimo assessment
      const { data: lastAssessment } = await supabase
        .from('assessments')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || 'N/A',
        is_blocked: profile?.is_blocked || false,
        created_at: user.created_at,
        assessmentCount: assessmentCount || 0,
        last_assessment_date: lastAssessment?.created_at || null
      };
    }));

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/assessments
 * Lista assessment con dettagli utente
 */
router.get('/assessments', async (req, res) => {
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    
    const usersMap = {};
    authUsers.forEach(user => {
      usersMap[user.id] = {
        email: user.email,
        created_at: user.created_at
      };
    });

    const { data: assessments } = await supabase
      .from('assessments')
      .select(`
        id,
        status,
        total_score,
        created_at,
        completed_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    const assessmentsWithUser = await Promise.all(assessments.map(async (assessment) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', assessment.user_id)
        .single();

      const authUser = usersMap[assessment.user_id];

      return {
        ...assessment,
        userName: profile?.full_name || 'N/A',
        userEmail: authUser?.email || 'N/A'
      };
    }));

    res.json({ success: true, assessments: assessmentsWithUser });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// NUOVI ENDPOINT: USER MANAGEMENT
// ============================================

/**
 * POST /api/admin/users/create
 * Crea nuovo utente
 */
router.post('/users/create', async (req, res) => {
  try {
    const { email, fullName, password } = req.body;

    // Validazione
    if (!email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, nome e password sono obbligatori'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La password deve essere di almeno 6 caratteri'
      });
    }

    // Crea utente in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-conferma email
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message || 'Errore nella creazione utente'
      });
    }

    // Crea profilo in user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: authData.user.id,
        full_name: fullName,
        is_admin: false,
        is_blocked: false
      }]);

    if (profileError) {
      console.error('Profile error:', profileError);
      // Rollback: elimina utente da auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(500).json({
        success: false,
        message: 'Errore nella creazione del profilo'
      });
    }

    res.json({
      success: true,
      message: 'Utente creato con successo',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName
      }
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

/**
 * PUT /api/admin/users/:id/block
 * Blocca/Sblocca utente
 */
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;

    // Validazione
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Il campo "blocked" deve essere true o false'
      });
    }

    // Aggiorna profilo
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ is_blocked: blocked })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error blocking user:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'aggiornamento utente'
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Invalida sessioni se bloccato (opzionale)
    if (blocked) {
      try {
        await supabase.auth.admin.signOut(id);
      } catch (signOutError) {
        console.log('Could not sign out user:', signOutError);
        // Non è un errore critico, continua
      }
    }

    res.json({
      success: true,
      message: blocked ? 'Utente bloccato' : 'Utente sbloccato',
      user: data[0]
    });

  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Elimina utente e tutti i suoi dati
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica che l'utente esista
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Previeni eliminazione admin
    if (profile.is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Non è possibile eliminare un account admin'
      });
    }

    // Get all assessments
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('user_id', id);

    if (assessments && assessments.length > 0) {
      const assessmentIds = assessments.map(a => a.id);
      
      // Elimina responses
      await supabase
        .from('assessment_responses')
        .delete()
        .in('assessment_id', assessmentIds);

      // Elimina results
      await supabase
        .from('assessment_results')
        .delete()
        .in('assessment_id', assessmentIds);

      // Elimina qualitative reports
      await supabase
        .from('qualitative_reports')
        .delete()
        .in('assessment_id', assessmentIds);

      // Elimina assessments
      await supabase
        .from('assessments')
        .delete()
        .eq('user_id', id);
    }

    // Elimina profilo
    await supabase
      .from('user_profiles')
      .delete()
      .eq('id', id);

    // Elimina da Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);

    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Continua comunque, i dati sono già stati eliminati
    }

    res.json({
      success: true,
      message: 'Utente eliminato con successo'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

// ============================================
// NUOVI ENDPOINT: ASSESSMENT MANAGEMENT
// ============================================

/**
 * DELETE /api/admin/assessments/:id
 * Elimina assessment
 */
router.delete('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica esistenza
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment non trovato'
      });
    }

    // Elimina risposte
    await supabase
      .from('assessment_responses')
      .delete()
      .eq('assessment_id', id);

    // Elimina risultati
    await supabase
      .from('assessment_results')
      .delete()
      .eq('assessment_id', id);

    // Elimina report qualitativo
    await supabase
      .from('qualitative_reports')
      .delete()
      .eq('assessment_id', id);

    // Elimina assessment
    const { error: deleteError } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting assessment:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Errore nell\'eliminazione'
      });
    }

    res.json({
      success: true,
      message: 'Assessment eliminato con successo'
    });

  } catch (error) {
    console.error('Error deleting assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

// ============================================
// NUOVI ENDPOINT: EMAIL SYSTEM
// ============================================

/**
 * POST /api/admin/emails/send
 * Invia email bulk
 * RICHIEDE: npm install resend
 */
router.post('/emails/send', async (req, res) => {
  try {
    const { recipients, subject, body } = req.body;

    // Validazione
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fornire almeno un destinatario'
      });
    }

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Oggetto e messaggio sono obbligatori'
      });
    }

    // Limite sicurezza
    if (recipients.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Massimo 100 destinatari per invio'
      });
    }

    // Verifica che Resend sia configurato
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Resend API key non configurata. Aggiungi RESEND_API_KEY nelle variabili ambiente.'
      });
    }

    // Import dinamico Resend
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Get all auth users per trovare match email -> user_id
    const { data: { users: allAuthUsers } } = await supabase.auth.admin.listUsers();
    
    // Crea mappa email -> user_id
    const emailToUserId = {};
    allAuthUsers.forEach(user => {
      if (user.email) {
        emailToUserId[user.email.toLowerCase()] = user.id;
      }
    });

    // Get tutti i profili in un colpo solo (performance)
    const userIds = Object.values(emailToUserId);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    // Crea mappa user_id -> full_name
    const userIdToName = {};
    if (profiles) {
      profiles.forEach(profile => {
        userIdToName[profile.id] = profile.full_name;
      });
    }

    // Invia email
    const emailPromises = recipients.map(async (email) => {
      try {
        // Trova nome utente dalla mappa
        const userId = emailToUserId[email.toLowerCase()];
        const userName = userId ? (userIdToName[userId] || 'Utente') : 'Utente';
        
        // Sostituisci placeholders
        const personalizedBody = body
          .replace(/{name}/g, userName)
          .replace(/{email}/g, email);

        // Invia con dominio valutolab.com
        const { data, error } = await resend.emails.send({
          from: 'ValutoLab <noreply@valutolab.com>',
          to: [email],
          subject: subject,
          html: personalizedBody.replace(/\n/g, '<br>')
        });

        if (error) {
          console.error(`Error sending to ${email}:`, error);
          return { email, success: false, error: error.message };
        }

        return { email, success: true, id: data.id };
      } catch (error) {
        console.error(`Exception sending to ${email}:`, error);
        return { email, success: false, error: error.message };
      }
    });

    const results = await Promise.all(emailPromises);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Salva log (se tabella esiste)
    try {
      const logPromises = results.map(result => {
        return supabase
          .from('email_logs')
          .insert([{
            recipient: result.email,
            subject: subject,
            status: result.success ? 'sent' : 'failed',
            error_message: result.error || null,
            sent_by: 'admin',
            sent_at: new Date().toISOString()
          }]);
      });

      await Promise.all(logPromises);
    } catch (logError) {
      console.log('Could not save email logs (table may not exist):', logError.message);
      // Non è un errore critico
    }

    res.json({
      success: true,
      message: `Email inviate: ${successful} successo, ${failed} fallite`,
      results: {
        successful,
        failed,
        details: results
      }
    });

  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server nell\'invio email',
      error: error.message
    });
  }
});

/**
 * GET /api/admin/emails/logs
 * Recupera log email (opzionale)
 */
router.get('/emails/logs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);

    if (error) {
      // Tabella potrebbe non esistere
      console.log('Email logs table may not exist:', error.message);
      return res.json({
        success: true,
        logs: []
      });
    }

    res.json({
      success: true,
      logs: data || []
    });

  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server'
    });
  }
});

export default router;
