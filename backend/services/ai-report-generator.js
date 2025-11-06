import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../config/supabase.js';
import { categoryLabels } from '../data/questions.js';

// Inizializza client Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Costruisce il prompt per Claude AI
 */
function buildAIPrompt(assessmentData, userProfile, benchmarkData) {
  const scoresFormatted = Object.entries(assessmentData.categoryScores)
    .map(([category, score]) => `  - ${categoryLabels[category]}: ${score.toFixed(1)}/5.0`)
    .join('\n');

  return `Sei un esperto consulente HR specializzato nello sviluppo delle competenze professionali.

CONTESTO UTENTE:
- Ruolo: ${userProfile.role || 'Professionista'}
- Settore: ${userProfile.industry || 'Generale'}
- Seniority: ${userProfile.seniority || 'Mid-level'}

PUNTEGGI ASSESSMENT (scala 1-5):
${scoresFormatted}

Punteggio generale: ${assessmentData.overallScore.toFixed(1)}/5.0

COMPITO:
Genera un report qualitativo professionale in formato JSON con questa struttura ESATTA:

{
  "category_interpretations": {
    "communication": {
      "score": 4.3,
      "level": "Avanzato",
      "description": "Breve descrizione del livello raggiunto (2-3 frasi in italiano)",
      "strengths": ["punto forza 1", "punto forza 2"],
      "improvements": ["area miglioramento 1", "area miglioramento 2"]
    }
    // ... ripeti per tutte le 12 categorie: communication, leadership, problem_solving, teamwork, 
    // time_management, adaptability, creativity, critical_thinking, empathy, resilience, 
    // negotiation, decision_making
  },
  
  "development_plan": {
    "focus_areas": [
      {
        "skill": "Teamwork",
        "current_score": 4.0,
        "target_score": 4.5,
        "priority": "Alta",
        "actions": [
          "Azione concreta 1 con timeline specifica",
          "Azione concreta 2 con timeline specifica",
          "Azione concreta 3 con timeline specifica"
        ],
        "resources": ["Libro/Corso consigliato 1", "Risorsa 2"]
      }
      // Massimo 3 focus_areas (le 3 competenze con punteggio più basso)
    ],
    "timeline": "90 giorni",
    "quick_wins": ["Quick win 1", "Quick win 2", "Quick win 3"]
  },
  
  "profile_insights": {
    "summary": "Sintesi del profilo complessivo in 3-4 frasi",
    "patterns": ["Pattern comportamentale 1 identificato", "Pattern 2"],
    "suggested_profile": "Es: Technical Leader, Strategic Thinker, People Manager",
    "ideal_roles": ["Ruolo ideale 1", "Ruolo ideale 2", "Ruolo ideale 3"],
    "unique_strengths": "Cosa distingue positivamente questo profilo"
  }
}

REGOLE IMPORTANTI:
1. Usa un tono professionale ma accessibile in italiano
2. Sii specifico e concreto, evita frasi generiche
3. Ogni azione nel development_plan deve essere SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
4. Basa tutto sui dati forniti
5. Rispondi SOLO con il JSON, NESSUN testo aggiuntivo prima o dopo
6. Assicurati che il JSON sia valido e parsabile
7. Includi TUTTE le 12 categorie in category_interpretations`;
}

/**
 * Recupera dati assessment dal database
 */
async function getAssessmentData(assessmentId) {
  // Get assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (assessmentError) throw new Error(`Assessment not found: ${assessmentError.message}`);

  // Get results per category
  const { data: results, error: resultsError } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('assessment_id', assessmentId);

  if (resultsError) throw new Error(`Results not found: ${resultsError.message}`);

  // Organizza per categoria
  const categoryScores = {};
  results.forEach(r => {
    categoryScores[r.skill_category] = r.score;
  });

  return {
    assessment,
    categoryScores,
    overallScore: assessment.total_score,
    userId: assessment.user_id
  };
}

/**
 * Recupera profilo utente
 */
async function getUserProfile(userId) {
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.warn('User profile not found, using defaults');
    return { role: null, industry: null, seniority: null };
  }

  return profile;
}

/**
 * Recupera benchmark data (placeholder per ora)
 */
async function getBenchmarkData(userProfile) {
  // TODO: Implementare query benchmark reali quando avremo dati
  return {
    note: 'Benchmark data will be calculated when sufficient data is available'
  };
}

/**
 * Genera report qualitativo usando Claude AI
 */
export async function generateQualitativeReport(assessmentId) {
  try {
    console.log(`🤖 Generating qualitative report for assessment: ${assessmentId}`);

    // 1. Recupera dati
    const assessmentData = await getAssessmentData(assessmentId);
    const userProfile = await getUserProfile(assessmentData.userId);
    const benchmarkData = await getBenchmarkData(userProfile);

    console.log(`📊 Assessment data loaded for user: ${assessmentData.userId}`);
    console.log(`👤 User profile: ${userProfile.role || 'N/A'} - ${userProfile.industry || 'N/A'}`);

    // 2. Costruisci prompt
    const prompt = buildAIPrompt(assessmentData, userProfile, benchmarkData);

    // 3. Chiama Claude API
    console.log('🔮 Calling Claude API...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    console.log(`✅ Claude API response received (${response.usage.input_tokens} in, ${response.usage.output_tokens} out)`);

    // 4. Parsifica risposta
    let reportData;
    try {
      const rawText = response.content[0].text;
      // Rimuovi eventuali backticks markdown
      const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      reportData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw response:', response.content[0].text);
      throw new Error('Invalid JSON response from AI');
    }

    // 5. Salva in database
    const { data: savedReport, error: saveError } = await supabase
      .from('qualitative_reports')
      .insert({
        assessment_id: assessmentId,
        user_id: assessmentData.userId,
        category_interpretations: reportData.category_interpretations,
        development_plan: reportData.development_plan,
        profile_insights: reportData.profile_insights,
        ai_model: 'claude-sonnet-4-20250514',
        generation_tokens: response.usage.output_tokens
      })
      .select()
      .single();

    if (saveError) {
      console.error('❌ Failed to save report:', saveError);
      throw new Error(`Failed to save report: ${saveError.message}`);
    }

    console.log(`💾 Report saved successfully: ${savedReport.id}`);

    return savedReport;
  } catch (error) {
    console.error('❌ Error generating qualitative report:', error);
    throw error;
  }
}

/**
 * Recupera report qualitativo esistente
 */
export async function getQualitativeReport(assessmentId) {
  const { data: report, error } = await supabase
    .from('qualitative_reports')
    .select('*')
    .eq('assessment_id', assessmentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Report non trovato
      return null;
    }
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return report;
}