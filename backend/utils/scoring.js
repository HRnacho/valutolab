// Mapping delle categorie e relative domande
const categoryMapping = {
  communication: [1, 2, 3, 4],
  leadership: [5, 6, 7, 8],
  problem_solving: [9, 10, 11, 12],
  teamwork: [13, 14, 15, 16],
  time_management: [17, 18, 19, 20],
  adaptability: [21, 22, 23, 24],
  creativity: [25, 26, 27, 28],
  critical_thinking: [29, 30, 31, 32],
  empathy: [33, 34, 35, 36],
  resilience: [37, 38, 39, 40],
  negotiation: [41, 42, 43, 44],
  decision_making: [45, 46, 47, 48],
}

const categoryLabels = {
  communication: 'Comunicazione',
  leadership: 'Leadership',
  problem_solving: 'Problem Solving',
  teamwork: 'Lavoro di Squadra',
  time_management: 'Gestione del Tempo',
  adaptability: 'Adattabilità',
  creativity: 'Creatività',
  critical_thinking: 'Pensiero Critico',
  empathy: 'Empatia',
  resilience: 'Resilienza',
  negotiation: 'Negoziazione',
  decision_making: 'Decision Making',
}

/**
 * Calculate scores for each category based on assessment responses
 * @param {Array} responses - Array of {question_id, answer}
 * @returns {Array} Array of category results
 */
function calculateCategoryScores(responses) {
  const results = []

  // Convert responses to map for easy lookup
  const answersMap = {}
  responses.forEach((r) => {
    answersMap[r.question_id] = r.answer
  })

  // Calculate score for each category
  for (const [category, questionIds] of Object.entries(categoryMapping)) {
    const categoryAnswers = questionIds.map((qid) => answersMap[qid]).filter((a) => a !== undefined)

    if (categoryAnswers.length === 4) {
      // All 4 questions answered
      const sum = categoryAnswers.reduce((acc, val) => acc + val, 0)
      const score = sum / 4 // Average of 4 questions (1-5 scale)

      results.push({
        skill_category: category,
        score: parseFloat(score.toFixed(2)),
      })
    }
  }

  return results
}

/**
 * Identify strengths (top 3 categories) and improvements (bottom 3)
 * @param {Array} categoryScores - Array of {skill_category, score}
 * @returns {Object} {strengths, improvements}
 */
function identifyStrengthsAndImprovements(categoryScores) {
  // Sort by score descending
  const sorted = [...categoryScores].sort((a, b) => b.score - a.score)

  // Top 3 = strengths
  const strengths = sorted.slice(0, 3).map((c) => categoryLabels[c.skill_category])

  // Bottom 3 = improvements
  const improvements = sorted.slice(-3).map((c) => categoryLabels[c.skill_category])

  return { strengths, improvements }
}

/**
 * Calculate overall assessment score (average of all categories)
 * @param {Array} categoryScores - Array of {skill_category, score}
 * @returns {Number} Overall score (1-5 scale)
 */
function calculateOverallScore(categoryScores) {
  const sum = categoryScores.reduce((acc, c) => acc + c.score, 0)
  const average = sum / categoryScores.length
  return parseFloat(average.toFixed(2))
}

export {
  calculateCategoryScores,
  identifyStrengthsAndImprovements,
  calculateOverallScore,
}