import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import assessmentsRouter from './routes/assessments.js';
import aiReportsRouter from './routes/ai-reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'ValutoLab Backend running on port 10000',
    timestamp: new Date().toISOString()
  });
});

// API v1 routes
app.get('/api/v1/test', (req, res) => {
  res.json({ 
    message: 'ValutoLab API v1 - Test endpoint working!',
    version: '1.0.0'
  });
});

// Assessment routes
app.use('/api/assessments', assessmentsRouter);

// AI Reports routes
app.use('/api/ai-reports', aiReportsRouter);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ValutoLab Backend running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Reports: http://localhost:${PORT}/api/ai-reports`);
});
```

---

**Modifiche:**
- ✅ Importato `aiReportsRouter`
- ✅ Registrato route `/api/ai-reports`
- ✅ Aggiunto log di startup per AI Reports

---

**Salva, commit & push!**

Messaggio commit:
```
Add AI report generator service and API endpoints