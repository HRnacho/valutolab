/**
 * /api/reports — Generazione PDF server-side via Puppeteer
 *
 * GET /api/reports/:assessmentId/pdf
 */

import express from 'express';
import puppeteer from 'puppeteer-core';
import QRCode from 'qrcode';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { buildReportHtml } from '../services/report-html.js';

const router = express.Router();
router.use(verifyToken);

const userId = req => req.user.supabase_id ?? req.user.id;

router.get('/:assessmentId/pdf', async (req, res, next) => {
  const { assessmentId } = req.params;
  let browser;

  try {
    // ── 1. Fetch assessment ─────────────────────────────────────────────────
    const { rows: assessmentRows } = await db.query(
      `SELECT * FROM assessments WHERE id = $1`,
      [assessmentId]
    );
    const assessment = assessmentRows[0];
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment non trovato' });
    }

    const uid = userId(req);
    if (assessment.user_id !== uid) {
      return res.status(403).json({ success: false, message: 'Non autorizzato' });
    }
    if (assessment.status !== 'completed') {
      return res.status(404).json({ success: false, message: 'Assessment non completato' });
    }

    // ── 2. Fetch profilo utente ────────────────────────────────────────────
    const { rows: profileRows } = await db.query(
      `SELECT id, full_name, role, industry, seniority FROM user_profiles WHERE id = $1`,
      [uid]
    );
    const profile = profileRows[0] ?? { id: uid, full_name: req.user.email ?? '' };

    // ── 3. Fetch risultati skill ───────────────────────────────────────────
    const { rows: results } = await db.query(
      `SELECT * FROM combined_assessment_results WHERE assessment_id = $1 ORDER BY final_score DESC`,
      [assessmentId]
    );

    // ── 4. Fetch report qualitativo ────────────────────────────────────────
    const { rows: reportRows } = await db.query(
      `SELECT profile_insights, category_interpretations FROM qualitative_reports WHERE assessment_id = $1 LIMIT 1`,
      [assessmentId]
    );
    const qualitativeReport = reportRows[0] ?? null;

    // ── 5. QR code — URL risultati online ─────────────────────────────────
    // Prova prima con share_token, fallback all'URL diretto
    let qrDataUrl = null;
    try {
      const { rows: shareRows } = await db.query(
        `SELECT share_token FROM shares WHERE assessment_id = $1 AND is_active = true LIMIT 1`,
        [assessmentId]
      ).catch(() => db.query(
        `SELECT share_token FROM assessment_shares WHERE assessment_id = $1 AND is_active = true LIMIT 1`,
        [assessmentId]
      ));
      const shareToken = shareRows[0]?.share_token;
      const qrUrl = shareToken
        ? `https://valutolab.com/profile/${shareToken}`
        : `https://valutolab.com/dashboard/results/${assessmentId}`;
      qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 160,
        margin: 1,
        color: { dark: '#0E1A2B', light: '#FBF8F2' },
      });
    } catch (_) {
      // QR opzionale — non blocca la generazione
    }

    // ── 6. Genera HTML ─────────────────────────────────────────────────────
    const html = buildReportHtml({ profile, assessment, results, qualitativeReport, qrDataUrl });

    // ── 7. Puppeteer → PDF ─────────────────────────────────────────────────
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    await browser.close();
    browser = null;

    // ── 8. Stream risposta ─────────────────────────────────────────────────
    const safeName = (profile.full_name || 'report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="valutolab-${safeName}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (err) {
    if (browser) { try { await browser.close(); } catch (_) {} }
    next(err);
  }
});

export default router;
