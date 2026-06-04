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
import trialRoutes from './routes/trial-pg.js';
import trackingRouter from './routes/tracking.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'ValutoLab Backend PG running on port 3002',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/assessments', assessmentsRouter);
app.use('/api/ai-reports', aiReportsRouter);
app.use('/api', situationalRouter);
app.use('/api/admin', adminRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/leadership', leadershipRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/', trackingRouter);
app.use('/api/v1/trial', trialRoutes);

app.listen(PORT, () => {
  console.log(`✅ ValutoLab Backend PG running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️  Database: PostgreSQL locale`);
});
