import express from 'express'
import { createClient } from '@supabase/supabase-js'
import {
  calculateCategoryScores,
  identifyStrengthsAndImprovements,
  calculateOverallScore,
} from '../utils/scoring.js'

const router = express.Router()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
)

/**
 * POST /api/assessments/:id/calculate
 * Calculate scores for a completed assessment
 */
router.post('/:id/calculate', async (req, res) => {
  try {
    const { id } = req.params

    // 1. Get all responses for this assessment
    const { data: responses, error: responsesError } = await supabase
      .from('assessment_responses')
      .select('question_id, answer')
      .eq('assessment_id', id)

    if (responsesError) throw responsesError

    if (!responses || responses.length !== 48) {
      return res.status(400).json({
        error: 'Assessment incomplete',
        message: `Only ${responses?.length || 0} of 48 questions answered`,
      })
    }

    // 2. Calculate category scores
    const categoryScores = calculateCategoryScores(responses)

    // 3. Calculate overall score
    const overallScore = calculateOverallScore(categoryScores)

    // 4. Identify strengths and improvements
    const { strengths, improvements } = identifyStrengthsAndImprovements(categoryScores)

    // 5. Save category results to database
    const resultsToInsert = categoryScores.map((cat) => ({
      assessment_id: id,
      skill_category: cat.skill_category,
      score: cat.score,
      percentile: null, // TODO: Calculate percentile later
      strengths: strengths,
      improvements: improvements,
    }))

    const { error: resultsError } = await supabase
      .from('assessment_results')
      .insert(resultsToInsert)

    if (resultsError) throw resultsError

    // 6. Update assessment with overall score and completion status
    const { error: updateError } = await supabase
      .from('assessments')
      .update({
        total_score: overallScore,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw updateError

    // 7. Return results
    res.json({
      success: true,
      overallScore,
      categoryScores,
      strengths,
      improvements,
      message: 'Assessment scored successfully',
    })
  } catch (error) {
    console.error('Error calculating assessment scores:', error)
    res.status(500).json({
      error: 'Server error',
      message: error.message,
    })
  }
})

export default router