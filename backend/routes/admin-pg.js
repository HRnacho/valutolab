import express from 'express';
import { createClient } from '@supabase/supabase-js';
import db from '../config/database.js';

const router = express.Router();

// Supabase SOLO per auth.admin
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

    const assessmentsResult = await db.query(
      'SELECT status, created_at, completed_at FROM assessments'
    );
    const assessments = assessmentsResult.rows;

    const completed = assessments.filter(a => a.status === 'completed').length;
    const inProgress = assessments.filter(a => a.status === 'in_progress').length;
    const abandoned = assessments.filter(a => a.status === 'abandoned').length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLast7Days = authUsers?.filter(u => new Date(u.created_at) > sevenDaysAgo).length || 0;
    const completedLast7Days = assessments.filter(a =>
      a.status === 'completed' && a.completed_at && new Date(a.completed_at) > sevenDaysAgo
    ).length;

    const completedWithTime = assessments.filter(a => a.status === 'completed' && a.created_at && a.completed_at);
    let avgCompletionTime = 0;
    if (completedWithTime.length > 0) {
      const totalTime = completedWithTime.reduce((sum, a) => {
        return sum + (new Date(a.completed_at) - new Date(a.created_at)) / (1000 * 60);
      }, 0);
      avgCompletionTime = Math.round(totalTime / completedWithTime.length);
    }

    const avgScoresResult = await db.query(
      'SELECT skill_category, final_score FROM combined_assessment_results'
    );
    const categoryAverages = {};
    avgScoresResult.rows.forEach(score => {
      if (!categoryAverages[score.skill_category]) {
        categoryAverages[score.skill_category] = { total: 0, count: 0 };
      }
      categoryAverages[score.skill_category].total += parseFloat(score.final_score);
      categoryAverages[score.skill_category].count += 1;
    });
    Object.keys(categoryAverages).forEach(key => {
      categoryAverages[key] = (categoryAverages[key].total / categoryAverages[key].count).toFixed(2);
    });

    res.json({
      success: true,
      stats: {
        totalUsers: authUsers?.length || 0,
        totalAssessments: assessments.length,
        completedAssessments: completed,
        inProgressAssessments: inProgress,
        abandonedAssessments: abandoned,
        avgCompletionTime,
        newUsersLast7Days,
        completedLast7Days,
        categoryAverages
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const usersWithStats = await Promise.all(authUsers.map(async (user) => {
      const profileResult = await db.query(
        'SELECT full_name, is_blocked FROM user_profiles WHERE id = $1',
        [user.id]
      );
      const profile = profileResult.rows[0];

      const countResult = await db.query(
        'SELECT COUNT(*) FROM assessments WHERE user_id = $1',
        [user.id]
      );
      const assessmentCount = parseInt(countResult.rows[0].count);

      const lastResult = await db.query(
        'SELECT created_at FROM assessments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.id]
      );
      const lastAssessment = lastResult.rows[0];

      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || 'N/A',
        is_blocked: profile?.is_blocked || false,
        created_at: user.created_at,
        assessmentCount,
        last_assessment_date: lastAssessment?.created_at || null
      };
    }));

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/assessments
router.get('/assessments', async (req, res) => {
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const usersMap = {};
    authUsers.forEach(user => {
      usersMap[user.id] = { email: user.email, created_at: user.created_at };
    });

    const assessmentsResult = await db.query(
      `SELECT id, status, total_score, created_at, completed_at, user_id 
       FROM assessments ORDER BY created_at DESC LIMIT 100`
    );

    const assessmentsWithUser = await Promise.all(assessmentsResult.rows.map(async (assessment) => {
      const profileResult = await db.query(
        'SELECT full_name FROM user_profiles WHERE id = $1',
        [assessment.user_id]
      );
      const profile = profileResult.rows[0];
      const authUser = usersMap[assessment.user_id];
      return {
        ...assessment,
        userName: profile?.full_name || 'N/A',
        userEmail: authUser?.email || 'N/A'
      };
    }));

    res.json({ success: true, assessments: assessmentsWithUser });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/users/create
router.post('/users/create', async (req, res) => {
  try {
    const { email, fullName, password } = req.body;
    if (!email || !fullName || !password) {
      return res.status(400).json({ success: false, message: 'Email, nome e password sono obbligatori' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'La password deve essere di almeno 6 caratteri' });
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { full_name: fullName }
    });
    if (authError) return res.status(400).json({ success: false, message: authError.message });

    try {
      await db.query(
        'INSERT INTO user_profiles (id, full_name, is_admin, is_blocked) VALUES ($1, $2, false, false)',
        [authData.user.id, fullName]
      );
    } catch (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ success: false, message: 'Errore nella creazione del profilo' });
    }

    res.json({ success: true, message: 'Utente creato con successo', user: { id: authData.user.id, email: authData.user.email, full_name: fullName } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore del server' });
  }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { blocked } = req.body;
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Il campo "blocked" deve essere true o false' });
    }
    const result = await db.query(
      'UPDATE user_profiles SET is_blocked = $1 WHERE id = $2 RETURNING *',
      [blocked, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }
    if (blocked) {
      try { await supabase.auth.admin.signOut(id); } catch (e) {}
    }
    res.json({ success: true, message: blocked ? 'Utente bloccato' : 'Utente sbloccato', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore del server' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const profileResult = await db.query('SELECT * FROM user_profiles WHERE id = $1', [id]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utente non trovato' });
    }
    if (profileResult.rows[0].is_admin) {
      return res.status(403).json({ success: false, message: 'Non è possibile eliminare un account admin' });
    }

    const assessmentsResult = await db.query('SELECT id FROM assessments WHERE user_id = $1', [id]);
    if (assessmentsResult.rows.length > 0) {
      const ids = assessmentsResult.rows.map(a => a.id);
      await db.query('DELETE FROM assessment_responses WHERE assessment_id = ANY($1)', [ids]);
      await db.query('DELETE FROM assessment_results WHERE assessment_id = ANY($1)', [ids]);
      await db.query('DELETE FROM qualitative_reports WHERE assessment_id = ANY($1)', [ids]);
      await db.query('DELETE FROM assessments WHERE user_id = $1', [id]);
    }
    await db.query('DELETE FROM user_profiles WHERE id = $1', [id]);
    await supabase.auth.admin.deleteUser(id);

    res.json({ success: true, message: 'Utente eliminato con successo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore del server' });
  }
});

// DELETE /api/admin/assessments/:id
router.delete('/assessments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM assessments WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Assessment non trovato' });
    }
    await db.query('DELETE FROM assessment_responses WHERE assessment_id = $1', [id]);
    await db.query('DELETE FROM assessment_results WHERE assessment_id = $1', [id]);
    await db.query('DELETE FROM qualitative_reports WHERE assessment_id = $1', [id]);
    await db.query('DELETE FROM assessments WHERE id = $1', [id]);
    res.json({ success: true, message: 'Assessment eliminato con successo' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore del server' });
  }
});

// GET /api/admin/questions
router.get('/questions', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM assessment_questions ORDER BY category ASC, question_order ASC'
    );
    const questions = result.rows;
    const groupedByCategory = questions.reduce((acc, q) => {
      if (!acc[q.category]) acc[q.category] = [];
      acc[q.category].push(q);
      return acc;
    }, {});
    res.json({ success: true, questions, groupedByCategory, totalQuestions: questions.length, activeQuestions: questions.filter(q => q.is_active).length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/questions/stats
router.get('/questions/stats', async (req, res) => {
  try {
    const result = await db.query('SELECT category, is_active FROM assessment_questions');
    const questions = result.rows;
    const stats = {
      total: questions.length,
      active: questions.filter(q => q.is_active).length,
      inactive: questions.filter(q => !q.is_active).length,
      byCategory: {}
    };
    questions.forEach(q => {
      if (!stats.byCategory[q.category]) stats.byCategory[q.category] = { total: 0, active: 0, inactive: 0 };
      stats.byCategory[q.category].total++;
      if (q.is_active) stats.byCategory[q.category].active++;
      else stats.byCategory[q.category].inactive++;
    });
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/admin/emails/logs
router.get('/emails/logs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100');
    res.json({ success: true, logs: result.rows });
  } catch (error) {
    res.json({ success: true, logs: [] });
  }
});

export default router;
