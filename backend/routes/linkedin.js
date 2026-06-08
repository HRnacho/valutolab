/**
 * LinkedIn OAuth 2.0 + Share API
 *
 * Endpoints:
 *   GET  /api/linkedin/auth              → redirect a LinkedIn OAuth
 *   GET  /api/linkedin/callback          → exchange code → access_token, redirect al frontend
 *   POST /api/linkedin/post-badge        → upload immagine + crea post ugcPosts
 *
 * Env vars richiesti:
 *   LINKEDIN_CLIENT_ID
 *   LINKEDIN_CLIENT_SECRET
 *   LINKEDIN_REDIRECT_URI   (es. https://api.valutolab.com/api/linkedin/callback)
 *   FRONTEND_URL            (es. https://www.valutolab.com)
 */

import express from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';

const router = express.Router();

const {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI,
  FRONTEND_URL = 'https://www.valutolab.com',
} = process.env;

// ── GET /api/linkedin/auth ─────────────────────────────────────────────────
// Avvia il flusso OAuth. Accetta ?state= per passare dati (assessmentId, ecc.)
router.get('/auth', (req, res) => {
  if (!LINKEDIN_CLIENT_ID) {
    return res.status(503).json({ success: false, error: 'LinkedIn non configurato' });
  }

  const state = req.query.state || '';
  const scope = 'openid profile w_member_social';
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_REDIRECT_URI,
    state,
    scope,
  });

  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`);
});

// ── GET /api/linkedin/callback ─────────────────────────────────────────────
router.get('/callback', async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  if (oauthError) {
    // Utente ha rifiutato → redirect con errore
    return res.redirect(`${FRONTEND_URL}/dashboard?linkedin_error=denied`);
  }

  try {
    // 1. Exchange code → access_token
    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Token exchange fallito');
    }

    // 2. Recupera sub (person URN)
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const personUrn = profile.sub ? `urn:li:person:${profile.sub}` : null;

    if (!personUrn) throw new Error('Impossibile recuperare profilo LinkedIn');

    // 3. Redirect al frontend con token temporaneo (passiamo tutto via query params
    //    — in produzione preferire un token firmato o sessione server-side)
    const params = new URLSearchParams({
      linkedin_token: tokenData.access_token,
      linkedin_urn: personUrn,
      state: state || '',
    });
    res.redirect(`${FRONTEND_URL}/dashboard/results/${state}?${params}`);

  } catch (err) {
    console.error('LinkedIn callback error:', err);
    res.redirect(`${FRONTEND_URL}/dashboard?linkedin_error=${encodeURIComponent(err.message)}`);
  }
});

// ── POST /api/linkedin/post-badge ──────────────────────────────────────────
// Body: { access_token, person_urn, image_base64, caption }
router.post('/post-badge', async (req, res) => {
  const { access_token, person_urn, image_base64, caption } = req.body;

  if (!access_token || !person_urn || !image_base64) {
    return res.status(400).json({ success: false, error: 'Parametri mancanti' });
  }

  try {
    // ── Step 1: Register upload ──────────────────────────────────────────
    const registerRes = await fetch(
      'https://api.linkedin.com/v2/assets?action=registerUpload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify({
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: person_urn,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            }],
          },
        }),
      }
    );
    const registerData = await registerRes.json();

    if (!registerRes.ok) {
      throw new Error(registerData.message || 'Register upload fallito');
    }

    const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
    const asset = registerData.value?.asset;

    if (!uploadUrl || !asset) {
      throw new Error('Upload URL non disponibile — verifica che il prodotto "Share on LinkedIn" sia attivo nell\'app');
    }

    // ── Step 2: Upload immagine ──────────────────────────────────────────
    const imageBuffer = Buffer.from(image_base64, 'base64');
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'image/png',
      },
      body: imageBuffer,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload immagine fallito: ${uploadRes.status}`);
    }

    // ── Step 3: Crea post ugcPost ────────────────────────────────────────
    const postText = caption ||
      `Ho ottenuto la mia certificazione soft skills su ValutoLab!\n\n` +
      `Analisi di 12 competenze trasversali mappate sullo standard ESCO v1.2.\n\n` +
      `#SoftSkills #ESCO #ValutoLab #ProfessionalDevelopment`;

    const postRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: person_urn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: postText },
            shareMediaCategory: 'IMAGE',
            media: [{
              status: 'READY',
              description: { text: 'Certificazione Soft Skills ValutoLab' },
              media: asset,
              title: { text: 'ValutoLab — Soft Skills Assessment' },
            }],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    const postData = await postRes.json();

    if (!postRes.ok) {
      throw new Error(postData.message || `Post fallito: ${postRes.status}`);
    }

    res.json({ success: true, post_id: postData.id, message: 'Post pubblicato su LinkedIn!' });

  } catch (err) {
    console.error('LinkedIn post-badge error:', err);
    // Non trattiamo come errore fatale — il frontend mostrerà il fallback
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
