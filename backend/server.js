import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import assessmentsRouter from './routes/assessments.js';
import aiReportsRouter from './routes/ai-reports.js';
import situationalRouter from './routes/situational.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ValutoLab Backend running on port 10000',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/test', (req, res) => {
  res.json({ 
    message: 'ValutoLab API v1 - Test endpoint working!',
    version: '1.0.0'
  });
});

app.use('/api/assessments', assessmentsRouter);
app.use('/api/ai-reports', aiReportsRouter);
app.use('/api', situationalRouter);

app.listen(PORT, () => {
  console.log(`ValutoLab Backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`AI Reports: http://localhost:${PORT}/api/ai-reports`);
  console.log(`Situational Questions: http://localhost:${PORT}/api/situational-questions`);
});
