// =============================================
// FILE: backend/routes/trial.js
// =============================================

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { Resend } = require('resend');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// =============================================
// POST /api/v1/trial/create
// Riceve form dalla landing page aziende-trial
// =============================================
router.post('/create', async (req, res) => {
  const { fullName, email, company, phone, employees, sector } = req.body;

  // Validazione base
  if (!fullName || !email || !company) {
    return res.status(400).json({ 
      error: 'Nome, email e azienda sono obbligatori' 
    });
  }

  try {
    // 1. Verifica se email già registrata
    const { data: existing } = await supabase
      .from('trial_organizations')
      .select('id, status')
      .eq('contact_email', email)
      .single();

    if (existing) {
      return res.status(409).json({ 
        error: 'Questa email ha già un trial attivo. Controlla la tua casella email o contattaci.' 
      });
    }

    // 2. Salva richiesta trial nel database (status: pending)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 giorni

    const { data: trial, error: trialError } = await supabase
      .from('trial_organizations')
      .insert({
        company_name: company,
        contact_email: email,
        contact_name: fullName,
        phone: phone || null,
        employees: employees || null,
        sector: sector || null,
        assessment_quota: 20, // default, modificabile da admin
        expires_at: expiresAt,
        status: 'pending'
      })
      .select()
      .single();

    if (trialError) throw trialError;

    // 3. Invia email di notifica a TE (admin)
    await resend.emails.send({
      from: 'ValutoLab <noreply@valutolab.com>',
      to: 'info@valutolab.com', // la tua email
      subject: `🔔 Nuova richiesta trial: ${company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Nuova Richiesta Trial Azienda</h2>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Azienda:</strong> ${company}</p>
            <p><strong>Contatto:</strong> ${fullName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Telefono:</strong> ${phone || 'Non fornito'}</p>
            <p><strong>Dipendenti:</strong> ${employees || 'Non specificato'}</p>
            <p><strong>Settore:</strong> ${sector || 'Non specificato'}</p>
          </div>

          <div style="background: #EEF2FF; padding: 20px; border-radius: 8px;">
            <h3 style="color: #4F46E5; margin-top: 0;">Prossimo Step</h3>
            <p>Vai alla dashboard admin per attivare il trial:</p>
            <a href="https://valutolab.com/admin" 
               style="background: #4F46E5; color: white; padding: 12px 24px; 
                      border-radius: 6px; text-decoration: none; display: inline-block;">
              Vai all'Admin
            </a>
          </div>
        </div>
      `
    });

    // 4. Invia email di conferma all'azienda
    await resend.emails.send({
      from: 'ValutoLab <noreply@valutolab.com>',
      to: email,
      subject: '✅ Richiesta Trial Ricevuta - ValutoLab',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); 
                      padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ValutoLab</h1>
          </div>
          
          <div style="background: white; padding: 40px; border: 1px solid #E5E7EB; 
                      border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827;">Ciao ${fullName}! 👋</h2>
            
            <p style="color: #4B5563; font-size: 16px;">
              Abbiamo ricevuto la tua richiesta di trial gratuito per <strong>${company}</strong>.
            </p>

            <div style="background: #F9FAFB; border: 1px solid #E5E7EB; 
                        padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #111827; margin-top: 0;">Il tuo trial include:</h3>
              <ul style="color: #4B5563; line-height: 1.8;">
                <li>✅ <strong>20 assessment gratuiti</strong></li>
                <li>✅ <strong>30 giorni</strong> di accesso completo</li>
                <li>✅ Report AI dettagliati per ogni candidato</li>
                <li>✅ Dashboard comparazione candidati</li>
                <li>✅ Export PDF</li>
              </ul>
            </div>

            <div style="background: #EEF2FF; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #4F46E5; margin-top: 0;">Cosa succede ora?</h3>
              <ol style="color: #4B5563; line-height: 2;">
                <li>Riceverai le credenziali di accesso <strong>entro 2 ore</strong></li>
                <li>Ti contatteremo per una call di onboarding di 15 minuti</li>
                <li>Inizierai subito a valutare i tuoi candidati</li>
              </ol>
            </div>

            <p style="color: #4B5563;">
              Hai domande? Rispondi direttamente a questa email.<br>
              Siamo sempre disponibili.
            </p>

            <p style="color: #4B5563;">
              A presto,<br>
              <strong>Il Team ValutoLab</strong>
            </p>
          </div>
        </div>
      `
    });

    // 5. Risposta successo
    return res.status(200).json({ 
      success: true,
      message: 'Richiesta ricevuta! Controlla la tua email.',
      trial_id: trial.id
    });

  } catch (error) {
    console.error('Trial creation error:', error);
    return res.status(500).json({ 
      error: 'Errore interno. Riprova o contattaci a info@valutolab.com' 
    });
  }
});

// =============================================
// POST /api/v1/trial/activate/:id
// Attiva trial dall'admin (crea account Supabase + magic link)
// =============================================
router.post('/activate/:id', async (req, res) => {
  const { id } = req.params;
  const { assessment_quota, days } = req.body;

  try {
    // 1. Recupera trial
    const { data: trial, error: fetchError } = await supabase
      .from('trial_organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !trial) {
      return res.status(404).json({ error: 'Trial non trovato' });
    }

    if (trial.status === 'active') {
      return res.status(400).json({ error: 'Trial già attivo' });
    }

    // 2. Calcola quota e scadenza (usa parametri admin o default)
    const quota = assessment_quota || trial.assessment_quota || 20;
    const expiresAt = new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000);

    // 3. Crea account Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: trial.contact_email,
      email_confirm: true,
      user_metadata: {
        full_name: trial.contact_name,
        company: trial.company_name,
        is_trial: true,
        trial_id: id
      }
    });

    if (authError) {
      // Se utente esiste già, recupera user id
      if (authError.message.includes('already registered')) {
        const { data: existingUser } = await supabase.auth.admin
          .listUsers();
        const user = existingUser.users.find(u => u.email === trial.contact_email);
        if (!user) throw authError;
        authData = { user };
      } else {
        throw authError;
      }
    }

    // 4. Genera magic link per primo accesso
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: trial.contact_email,
      options: {
        redirectTo: 'https://valutolab.com/dashboard'
      }
    });

    if (linkError) throw linkError;

    // 5. Aggiorna trial nel database
    await supabase
      .from('trial_organizations')
      .update({
        status: 'active',
        user_id: authData.user.id,
        assessment_quota: quota,
        expires_at: expiresAt,
        activated_at: new Date().toISOString()
      })
      .eq('id', id);

    // 6. Invia email con magic link all'azienda
    await resend.emails.send({
      from: 'ValutoLab <noreply@valutolab.com>',
      to: trial.contact_email,
      subject: '🎉 Il tuo Trial ValutoLab è Attivo!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); 
                      padding: 40px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ValutoLab</h1>
            <p style="color: #C7D2FE; margin: 8px 0 0;">Il tuo trial è pronto!</p>
          </div>
          
          <div style="background: white; padding: 40px; border: 1px solid #E5E7EB; 
                      border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827;">Ciao ${trial.contact_name}! 🎉</h2>
            
            <p style="color: #4B5563; font-size: 16px;">
              Il tuo trial per <strong>${trial.company_name}</strong> è attivo.
            </p>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; 
                        padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h3 style="color: #166534; margin-top: 0;">Il tuo piano trial:</h3>
              <ul style="color: #15803D; line-height: 1.8; margin: 0;">
                <li>✅ <strong>${quota} assessment</strong> disponibili</li>
                <li>✅ Valido fino al <strong>${expiresAt.toLocaleDateString('it-IT')}</strong></li>
                <li>✅ Accesso completo a tutte le funzionalità</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${linkData.properties.action_link}" 
                 style="background: linear-gradient(135deg, #4F46E5, #7C3AED); 
                        color: white; padding: 16px 40px; border-radius: 8px; 
                        text-decoration: none; font-size: 18px; font-weight: bold;
                        display: inline-block;">
                Accedi alla Piattaforma →
              </a>
              <p style="color: #9CA3AF; font-size: 12px; margin-top: 12px;">
                Link valido per 24 ore
              </p>
            </div>

            <div style="background: #F9FAFB; padding: 20px; border-radius: 8px;">
              <h3 style="color: #111827; margin-top: 0;">Come iniziare:</h3>
              <ol style="color: #4B5563; line-height: 2;">
                <li>Clicca il bottone qui sopra per accedere</li>
                <li>Vai su <strong>"Invita Candidato"</strong></li>
                <li>Inserisci email del candidato</li>
                <li>Il candidato fa assessment in 15 minuti</li>
                <li>Vedi i risultati nella tua dashboard</li>
              </ol>
            </div>

            <p style="color: #4B5563; margin-top: 24px;">
              Hai bisogno di aiuto? Rispondi a questa email o scrivici a 
              <a href="mailto:info@valutolab.com" style="color: #4F46E5;">
                info@valutolab.com
              </a>
            </p>

            <p style="color: #4B5563;">
              Buon lavoro!<br>
              <strong>Il Team ValutoLab</strong>
            </p>
          </div>
        </div>
      `
    });

    return res.status(200).json({ 
      success: true,
      message: 'Trial attivato! Email con magic link inviata.',
      magic_link: linkData.properties.action_link
    });

  } catch (error) {
    console.error('Trial activation error:', error);
    return res.status(500).json({ 
      error: 'Errore attivazione trial: ' + error.message 
    });
  }
});

// =============================================
// GET /api/v1/trial/list
// Lista tutti i trial per admin dashboard
// =============================================
router.get('/list', async (req, res) => {
  try {
    const { data: trials, error } = await supabase
      .from('trial_organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, trials });

  } catch (error) {
    console.error('Trial list error:', error);
    return res.status(500).json({ error: 'Errore recupero trial' });
  }
});

// =============================================
// PUT /api/v1/trial/update/:id
// Modifica quota o scadenza da admin
// =============================================
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { assessment_quota, add_days, notes, status } = req.body;

  try {
    const updates = {};

    if (assessment_quota) updates.assessment_quota = assessment_quota;
    if (notes !== undefined) updates.notes = notes;
    if (status) updates.status = status;

    if (add_days) {
      const { data: trial } = await supabase
        .from('trial_organizations')
        .select('expires_at')
        .eq('id', id)
        .single();

      const currentExpiry = new Date(trial.expires_at);
      currentExpiry.setDate(currentExpiry.getDate() + add_days);
      updates.expires_at = currentExpiry.toISOString();
    }

    const { data, error } = await supabase
      .from('trial_organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, trial: data });

  } catch (error) {
    console.error('Trial update error:', error);
    return res.status(500).json({ error: 'Errore aggiornamento trial' });
  }
});

module.exports = router;
