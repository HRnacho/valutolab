import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

router.get('/invito/:campaign', async (req, res) => {
  const { campaign } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  try {
    await pool.query(
      'INSERT INTO campaign_clicks (campaign, ip_address, user_agent, referer) VALUES ($1, $2, $3, $4)',
      [campaign, ip, userAgent, referer]
    );
  } catch (err) {
    console.error('Tracking error:', err);
  }

  res.redirect(302, `https://valutolab.com/aziende-trial?utm_source=email&utm_medium=outreach&utm_campaign=${campaign}`);
});

export default router;
