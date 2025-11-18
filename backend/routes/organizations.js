const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// 1. CREA ORGANIZZAZIONE
// ============================================
router.post('/create', async (req, res) => {
  try {
    const { userId, name, type, contactEmail, billingEmail } = req.body;

    if (!userId || !name || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori: userId, name, contactEmail'
      });
    }

    // Crea organizzazione
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name,
        type: type || 'company',
        contact_email: contactEmail,
        billing_email: billingEmail || contactEmail,
        subscription_tier: 'free',
        assessment_quota: 5
      })
      .select()
      .single();

    if (orgError) throw orgError;

    // Aggiungi utente come owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        can_view_results: true,
        can_create_invites: true,
        can_manage_members: true
      });

    if (memberError) throw memberError;

    res.json({
      success: true,
      organization: org,
      message: 'Organizzazione creata con successo'
    });

  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'organizzazione',
      error: error.message
    });
  }
});

// ============================================
// 2. GET ORGANIZZAZIONE UTENTE
// ============================================
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Trova organizzazioni dell'utente
    const { data: memberships, error: memberError } = await supabase
      .from('organization_members')
      .select(`
        *,
        organizations (*)
      `)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    res.json({
      success: true,
      organizations: memberships.map(m => ({
        ...m.organizations,
        role: m.role,
        permissions: {
          can_view_results: m.can_view_results,
          can_create_invites: m.can_create_invites,
          can_manage_members: m.can_manage_members
        }
      }))
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle organizzazioni',
      error: error.message
    });
  }
});

// ============================================
// 3. GET DETTAGLI ORGANIZZAZIONE
// ============================================
router.get('/:orgId', async (req, res) => {
  try {
    const { orgId } = req.params;

    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    if (error) throw error;

    // Conta membri
    const { count: memberCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Conta inviti
    const { count: inviteCount } = await supabase
      .from('candidate_invites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId);

    // Conta completati
    const { count: completedCount } = await supabase
      .from('candidate_invites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'completed');

    res.json({
      success: true,
      organization: {
        ...org,
        stats: {
          members: memberCount || 0,
          invites: inviteCount || 0,
          completed: completedCount || 0,
          quota_remaining: org.assessment_quota - org.used_assessments
        }
      }
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'organizzazione',
      error: error.message
    });
  }
});

// ============================================
// 4. INVITA CANDIDATO/DIPENDENTE
// ============================================
router.post('/:orgId/invite', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { userId, candidateEmail, candidateName, assessmentType, notes } = req.body;

    if (!candidateEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email candidato obbligatoria'
      });
    }

    // Verifica quota disponibile
    const { data: org } = await supabase
      .from('organizations')
      .select('assessment_quota, used_assessments')
      .eq('id', orgId)
      .single();

    if (org.used_assessments >= org.assessment_quota) {
      return res.status(403).json({
        success: false,
        message: 'Quota mensile assessment esaurita'
      });
    }

    // Verifica permessi utente
    const { data: member } = await supabase
      .from('organization_members')
      .select('can_create_invites')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .single();

    if (!member || !member.can_create_invites) {
      return res.status(403).json({
        success: false,
        message: 'Non hai i permessi per invitare candidati'
      });
    }

    // Crea invito
    const { data: invite, error } = await supabase
      .from('candidate_invites')
      .insert({
        organization_id: orgId,
        invited_by: userId,
        candidate_email: candidateEmail,
        candidate_name: candidateName,
        assessment_type: assessmentType || 'internal',
        notes: notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Invia email invito
    // await sendInviteEmail(candidateEmail, invite.invite_token);

    res.json({
      success: true,
      invite,
      message: 'Invito creato con successo'
    });

  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'invito',
      error: error.message
    });
  }
});

// ============================================
// 5. LISTA INVITI ORGANIZZAZIONE
// ============================================
router.get('/:orgId/invites', async (req, res) => {
  try {
    const { orgId } = req.params;
    const { status } = req.query;

    let query = supabase
      .from('candidate_invites')
      .select(`
        *,
        assessments (
          id,
          total_score,
          completed_at
        )
      `)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invites, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      invites
    });

  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli inviti',
      error: error.message
    });
  }
});

// ============================================
// 6. VALIDA INVITO (per pagina pubblica)
// ============================================
router.get('/invite/:token/validate', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: invite, error } = await supabase
      .from('candidate_invites')
      .select(`
        *,
        organizations (name, type)
      `)
      .eq('invite_token', token)
      .single();

    if (error) throw error;

    // Verifica se scaduto
    const isExpired = new Date(invite.expires_at) < new Date();
    
    // Verifica se già completato
    const isCompleted = invite.status === 'completed';

    res.json({
      success: true,
      invite: {
        valid: !isExpired && !isCompleted,
        expired: isExpired,
        completed: isCompleted,
        candidate_name: invite.candidate_name,
        organization_name: invite.organizations.name,
        assessment_type: invite.assessment_type
      }
    });

  } catch (error) {
    console.error('Error validating invite:', error);
    res.status(404).json({
      success: false,
      message: 'Invito non trovato o non valido'
    });
  }
});

// ============================================
// 7. COMPLETA INVITO (dopo assessment)
// ============================================
router.post('/invite/:token/complete', async (req, res) => {
  try {
    const { token } = req.params;
    const { assessmentId } = req.body;

    // Aggiorna invito
    const { error: inviteError } = await supabase
      .from('candidate_invites')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        assessment_id: assessmentId
      })
      .eq('invite_token', token);

    if (inviteError) throw inviteError;

    // Incrementa used_assessments
    const { data: invite } = await supabase
      .from('candidate_invites')
      .select('organization_id')
      .eq('invite_token', token)
      .single();

    await supabase.rpc('increment', {
      table_name: 'organizations',
      column_name: 'used_assessments',
      row_id: invite.organization_id
    });

    res.json({
      success: true,
      message: 'Invito completato con successo'
    });

  } catch (error) {
    console.error('Error completing invite:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel completamento dell\'invito',
      error: error.message
    });
  }
});

// ============================================
// 8. MEMBRI ORGANIZZAZIONE
// ============================================
router.get('/:orgId/members', async (req, res) => {
  try {
    const { orgId } = req.params;

    const { data: members, error } = await supabase
      .from('organization_members')
      .select(`
        *,
        user_profiles (full_name, avatar_url)
      `)
      .eq('organization_id', orgId)
      .order('joined_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      members
    });

  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei membri',
      error: error.message
    });
  }
});

module.exports = router;
