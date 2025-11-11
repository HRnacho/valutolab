import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();

    const { data: assessments } = await supabase
      .from('assessments')
      .select('status');

    const completed = assessments?.filter(a => a.status === 'completed').length || 0;
    const inProgress = assessments?.filter(a => a.status === 'in_progress').length || 0;

    const { data: avgScores } = await supabase
      .from('combined_assessment_results')
      .select('skill_category, final_score');

    const categoryAverages = {};
    if (avgScores) {
      avgScores.forEach(score => {
        if (!categoryAverages[score.skill_category]) {
          categoryAverages[score.skill_category] = { total: 0, count: 0 };
        }
        categoryAverages[score.skill_category].total += parseFloat(score.final_score);
        categoryAverages[score.skill_category].count += 1;
      });

      Object.keys(categoryAverages).forEach(key => {
        categoryAverages[key] = (categoryAverages[key].total / categoryAverages[key].count).toFixed(2);
      });
    }

    res.json({
      success: true,
      stats: {
        totalUsers: authUsers?.length || 0,
        totalAssessments: assessments?.length || 0,
        completedAssessments: completed,
        inProgressAssessments: inProgress,
        categoryAverages
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) throw authError;

    const usersWithStats = await Promise.all(authUsers.map(async (user) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const { count: assessmentCount } = await supabase
        .from('assessments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      return {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || 'N/A',
        created_at: user.created_at,
        assessmentCount: assessmentCount || 0
      };
    }));

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/assessments', async (req, res) => {
  try {
    const { data: assessments } = await supabase
      .from('assessments')
      .select(`
        id,
        status,
        total_score,
        created_at,
        completed_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    const assessmentsWithUser = await Promise.all(assessments.map(async (assessment) => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', assessment.user_id)
        .single();

      const { data: email } = await supabase.auth.admin.getUserById(assessment.user_id);

      return {
        ...assessment,
        userName: profile?.full_name || 'N/A',
        userEmail: email?.user?.email || 'N/A'
      };
    }));

    res.json({ success: true, assessments: assessmentsWithUser });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;