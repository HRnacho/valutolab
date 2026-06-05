/**
 * /api/reports — Generazione PDF server-side via Puppeteer
 *
 * GET /api/reports/:assessmentId/pdf
 *   → 200 application/pdf   (stream)
 *   → 401 non autenticato
 *   → 403 assessment di un altro utente
 *   → 404 assessment non trovato / non completato
 *   → 500 errore Puppeteer
 */

import express from 'express';
import puppeteer from 'puppeteer-core';
import db from '../config/database.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { buildReportHtml } from '../services/report-html.js';

const router = express.Router();
router.use(verifyToken);

// Usa supabase_id se disponibile (utenti migrati), altrimenti id locale
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

    // Verifica che appartiene all'utente corrente
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

    // ── 4. Fetch report qualitativo (può essere null) ──────────────────────
    const { rows: reportRows } = await db.query(
      `SELECT profile_insights, category_interpretations FROM qualitative_reports WHERE assessment_id = $1 LIMIT 1`,
      [assessmentId]
    );
    // Le colonne sono jsonb separati, non un singolo report_data
    const qualitativeReport = reportRows[0] ?? null;

    // ── 5. Genera HTML ─────────────────────────────────────────────────────
    const html = buildReportHtml({ profile, assessment, results, qualitativeReport });

    // ── 6. Puppeteer → PDF ─────────────────────────────────────────────────
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

    // ── 7. Stream risposta ─────────────────────────────────────────────────
    const safeName = (profile.full_name || 'report')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="valutolab-${safeName}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);

  } catch (err) {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    next(err);
  }
});

export default router;
