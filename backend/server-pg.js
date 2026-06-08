import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import assessmentsRouter from './routes/assessments-pg.js';
import aiReportsRouter from './routes/ai-reports.js';
import situationalRouter from './routes/situational.js';
import adminRoutes from './routes/admin-pg.js';
import shareRoutes from './routes/share.js';
import leadershipRoutes from './routes/leadership.js';
import organizationsRoutes from './routes/organizations-pg.js';
import trialRoutes from './routes/trial.js';
import trialB2cRoutes from './routes/trial-b2c.js';
import trackingRouter from './routes/tracking.js';
import linkedinRouter from './routes/linkedin.js';
import dataRouter from './routes/data.js';
import reportsRouter from './routes/reports.js';
import { strictLimiter, generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const ALLOWED_ORIGINS = [
  'https://valutolab.com',
  'https://www.valutolab.com',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.set('trust proxy', 1); // Nginx / Cloudflare proxy

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());

// Rate limiting
app.use('/api/v1/trial/create',  strictLimiter);
app.use('/api/v1/trial/activate', strictLimiter);
app.use('/api/auth/login',        strictLimiter);   // brute-force protection
app.use('/api/auth/register',     strictLimiter);
app.use('/api', generalLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ValutoLab Backend PG running on port 3002',
    timestamp: new Date().toISOString()
  });
});

// ── Auth JWT custom (Fase 1 migrazione) ─────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Route esistenti (Supabase Auth — invariate) ──────────────────────────────
app.use('/api/assessments', assessmentsRouter);
app.use('/api/ai-reports', aiReportsRouter);
app.use('/api', situationalRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/leadership', leadershipRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/', trackingRouter);
app.use('/api/v1/trial', trialRoutes);
app.use('/api/trial-b2c', trialB2cRoutes);
app.use('/api/data', dataRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/linkedin', linkedinRouter);

// Error handler centralizzato — deve stare DOPO tutte le route
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ ValutoLab Backend PG running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: PostgreSQL locale`);
});
