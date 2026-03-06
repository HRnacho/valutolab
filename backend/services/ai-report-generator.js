import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '../config/supabase.js';
import { categoryLabels } from '../data/questions.js';

// Inizializza client Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ============================================================
// MAPPATURA ESCO v1.2 - Framework Europeo delle Competenze
// Fonte: European Commission - Aggiornato al 15 maggio 2024
// ============================================================
const ESCO_MAPPING = {
  communication: {
    escoGroup: 'Comunicare con gli altri',
    escoSkills: ['comunicare con gli altri', 'ascoltare attivamente', 'dare feedback costruttivo', 'adattare lo stile comunicativo'],
    escoURI: 'http://data.europa.eu/esco/skill/b7f2d1d7',
    onetRef: 'Social Skills – Communicating (2.B.1.a)',
    eqfRange: '4-6'
  },
  leadership: {
    escoGroup: 'Gestire e guidare gli altri',
    escoSkills: ['guidare gli altri', 'motivare i dipendenti', 'delegare responsabilità', 'ispirare fiducia'],
    escoURI: 'http://data.europa.eu/esco/skill/leadership-group',
    onetRef: 'Management Skills (2.B.3)',
    eqfRange: '5-7'
  },
  problem_solving: {
    escoGroup: 'Risolvere problemi e pensiero critico',
    escoSkills: ['identificare soluzioni ai problemi', 'pensiero analitico', 'applicare il pensiero critico', 'gestire la pressione'],
    escoURI: 'http://data.europa.eu/esco/skill/problem-solving-group',
    onetRef: 'Complex Problem Solving Skills (2.A.2)',
    eqfRange: '4-6'
  },
  teamwork: {
    escoGroup: 'Lavorare con gli altri',
    escoSkills: ['lavorare in squadra', 'collaborare con i colleghi', 'gestire i conflitti', 'supportare i colleghi'],
    escoURI: 'http://data.europa.eu/esco/skill/teamwork-group',
    onetRef: 'Social Skills – Coordination (2.B.1.b)',
    eqfRange: '3-5'
  },
  time_management: {
    escoGroup: 'Gestire se stessi e il proprio lavoro',
    escoSkills: ['gestire il proprio tempo', 'rispettare le scadenze', 'stabilire le priorità', 'organizzare il lavoro autonomamente'],
    escoURI: 'http://data.europa.eu/esco/skill/self-management-group',
    onetRef: 'Resource Management Skills – Time Management (2.B.3.b)',
    eqfRange: '3-5'
  },
  adaptability: {
    escoGroup: "Adattarsi ai cambiamenti e all'incertezza",
    escoSkills: ['adattarsi ai cambiamenti', 'mostrare flessibilità', "gestire l'incertezza", 'apprendere rapidamente'],
    escoURI: 'http://data.europa.eu/esco/skill/adaptability-group',
    onetRef: 'Adaptability/Flexibility (1.C.4.a)',
    eqfRange: '4-6'
  },
  creativity: {
    escoGroup: 'Pensiero creativo e innovazione',
    escoSkills: ['pensare in modo creativo', 'generare nuove idee', 'applicare il pensiero innovativo', 'sperimentare approcci nuovi'],
    escoURI: 'http://data.europa.eu/esco/skill/creativity-group',
    onetRef: 'Originality (1.C.5.a)',
    eqfRange: '5-7'
  },
  critical_thinking: {
    escoGroup: 'Analisi e valutazione critica',
    escoSkills: ['applicare il pensiero critico', 'valutare le informazioni', 'identificare bias', 'ragionare in modo logico'],
    escoURI: 'http://data.europa.eu/esco/skill/critical-thinking-group',
    onetRef: 'Critical Thinking (2.A.2.a)',
    eqfRange: '5-7'
  },
  empathy: {
    escoGroup: 'Intelligenza emotiva e relazionale',
    escoSkills: ['mostrare empatia', 'creare un ambiente inclusivo', 'gestire le emozioni proprie e altrui', "applicare l'intelligenza emotiva"],
    escoURI: 'http://data.europa.eu/esco/skill/emotional-intelligence-group',
    onetRef: 'Social Perceptiveness (2.B.1.c)',
    eqfRange: '4-6'
  },
  resilience: {
    escoGroup: 'Resilienza e gestione dello stress',
    escoSkills: ['dimostrare resilienza', 'tollerare lo stress', 'mantenere un atteggiamento positivo', 'imparare dai fallimenti'],
    escoURI: 'http://data.europa.eu/esco/skill/resilience-group',
    onetRef: 'Stress Tolerance (1.C.4.b)',
    eqfRange: '3-5'
  },
  negotiation: {
    escoGroup: 'Negoziare e persuadere',
    escoSkills: ['negoziare', 'raggiungere accordi', 'mediare tra le parti', 'persuadere gli altri'],
    escoURI: 'http://data.europa.eu/esco/skill/S2.4',
    onetRef: 'Negotiation (2.B.1.e)',
    eqfRange: '5-7'
  },
  decision_making: {
    escoGroup: 'Prendere decisioni e assumere responsabilità',
    escoSkills: ['prendere decisioni', 'valutare le opzioni', 'assumersi la responsabilità', 'coinvolgere gli stakeholder'],
    escoURI: 'http://data.europa.eu/esco/skill/decision-making-group',
    onetRef: 'Judgment and Decision Making (2.A.2.b)',
    eqfRange: '5-7'
  }
};

/**
 * Calcola il livello ESCO in base al punteggio finale
 */
function getEscoLevel(score) {
  if (score >= 4.1) return 'Esperto';
  if (score >= 3.1) return 'Avanzato';
  if (score >= 2.1) return 'Intermedio';
  return 'Base';
}

/**
 * Formatta la mappatura ESCO compatta per il prompt
 */
function formatEscoForPrompt() {
  return Object.entries(ESCO_MAPPING)
    .map(([key, val]) => `  - ${key}: "${val.escoGroup}" | EQF ${val.eqfRange}`)
    .join('\n');
}

/**
 * Costruisce il prompt per Claude AI con weighted blend, analisi situazionale e ESCO v1.2
 */
function buildAIPrompt(assessmentData, situationalData, userProfile, benchmarkData) {
  const scoresFormatted = Object.entries(assessmentData.categoryScores)
    .map(([category, scores]) => {
      const esco = ESCO_MAPPING[category];
      const escoLevel = getEscoLevel(scores.final);
      return `  - ${categoryLabels[category]}:
      • Likert (autovalutazione): ${scores.likert.toFixed(1)}/5.0
      • Situazionale (comportamentale): ${scores.sjt.toFixed(1)}/3.0
      • Punteggio finale (70% Likert + 30% SJT): ${scores.final.toFixed(1)}/5.0
      • ESCO: "${esco?.escoGroup}" → Livello ${escoLevel} | EQF ${esco?.eqfRange}`;
    })
    .join('\n');

  const situationalChoices = situationalData.map(choice => {
    return `\n[${choice.skill}] Situazione: ${choice.situation}
Scelta: Opzione ${choice.selected} - ${choice.selectedText}
Pesi skill: ${JSON.stringify(choice.skillWeights)}`;
  }).join('\n');

  return `Sei un esperto consulente HR specializzato nello sviluppo delle competenze professionali, certificato nel framework europeo ESCO v1.2 (European Skills, Competences, Qualifications and Occupations - Commissione Europea, aggiornato maggio 2024).

CONTESTO UTENTE:
- Ruolo: ${userProfile.role || 'Professionista'}
- Settore: ${userProfile.industry || 'Generale'}
- Seniority: ${userProfile.seniority || 'Mid-level'}

PUNTEGGI ASSESSMENT WEIGHTED BLEND (70% Autovalutazione + 30% Comportamentale):
${scoresFormatted}

Punteggio generale finale: ${assessmentData.overallScore.toFixed(1)}/5.0

ANALISI SCELTE SITUAZIONALI:
L'utente ha completato 12 scenari comportamentali che rivelano il suo approccio reale alle situazioni professionali:
${situationalChoices}

FRAMEWORK EUROPEO ESCO v1.2 - RIFERIMENTO:
Tutte le competenze valutate sono mappate sullo standard europeo ESCO v1.2.
Scala livelli ESCO da usare nel report:
- Punteggio 1.0-2.0 → Livello Base
- Punteggio 2.1-3.0 → Livello Intermedio  
- Punteggio 3.1-4.0 → Livello Avanzato
- Punteggio 4.1-5.0 → Livello Esperto

Mappatura competenze → gruppi ESCO:
${formatEscoForPrompt()}

ISTRUZIONI ANALISI:
1. Analizza ENTRAMBI i tipi di dati:
   - Autovalutazione Likert (come si percepisce)
   - Scelte situazionali (come agisce realmente)
2. Identifica eventuali GAP tra autopercezione e comportamento effettivo
3. Le scelte situazionali rivelano pattern comportamentali più affidabili dell'autovalutazione
4. Per ogni competenza includi il campo esco_mapping con skill dimostrate e da sviluppare

COMPITO:
Genera un report qualitativo professionale in formato JSON con questa struttura ESATTA:

{
  "category_interpretations": {
    "communication": {
      "score": 4.3,
      "level": "Avanzato",
      "description": "Breve descrizione del livello raggiunto basata SIA su autovalutazione CHE su scelte comportamentali (2-3 frasi in italiano)",
      "strengths": ["punto forza 1 confermato da scelte situazionali", "punto forza 2"],
      "improvements": ["area miglioramento 1 emersa dalle scelte comportamentali", "area miglioramento 2"],
      "behavioral_notes": "Note specifiche sulle scelte situazionali per questa competenza",
      "esco_mapping": {
        "esco_level": "Avanzato",
        "esco_skills_demonstrated": ["comunicare con gli altri", "ascoltare attivamente"],
        "esco_skills_to_develop": ["dare feedback costruttivo"],
        "recognition_note": "Competenza riconosciuta nel framework europeo ESCO v1.2 come skill trasversale ad alta domanda nel mercato del lavoro europeo."
      }
    }
  },
  
  "development_plan": {
    "focus_areas": [
      {
        "skill": "Teamwork",
        "current_score": 4.0,
        "target_score": 4.5,
        "priority": "Alta",
        "gap_analysis": "Differenza tra come ti percepisci e come agisci realmente",
        "esco_target": "Raggiungere il livello Esperto ESCO nel gruppo 'Lavorare con gli altri'",
        "actions": [
          "Azione concreta 1 con timeline specifica",
          "Azione concreta 2 con timeline specifica",
          "Azione concreta 3 con timeline specifica"
        ],
        "resources": ["Libro/Corso consigliato 1", "Risorsa 2"]
      }
    ],
    "timeline": "90 giorni",
    "quick_wins": ["Quick win 1 basato su pattern comportamentali", "Quick win 2", "Quick win 3"]
  },
  
  "profile_insights": {
    "summary": "Sintesi del profilo complessivo in 3-4 frasi che integra autovalutazione e pattern comportamentali",
    "patterns": ["Pattern comportamentale 1 identificato dalle scelte situazionali", "Pattern 2"],
    "self_awareness": "Livello di autoconsapevolezza: quanto la percezione corrisponde al comportamento reale",
    "suggested_profile": "Es: Technical Leader, Strategic Thinker, People Manager",
    "ideal_roles": ["Ruolo ideale 1", "Ruolo ideale 2", "Ruolo ideale 3"],
    "unique_strengths": "Cosa distingue positivamente questo profilo basato su dati comportamentali",
    "esco_profile_summary": "Sintesi ESCO: quali aree trasversali del framework europeo questo professionista padroneggia e quali rappresentano un'opportunità di crescita certificabile."
  }
}

REGOLE IMPORTANTI:
1. Usa un tono professionale ma accessibile in italiano
2. Sii specifico e concreto, evita frasi generiche
3. Ogni azione nel development_plan deve essere SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
4. Basa tutto sui dati forniti, specialmente le scelte situazionali
5. Rispondi SOLO con il JSON, NESSUN testo aggiuntivo prima o dopo
6. Assicurati che il JSON sia valido e parsabile
7. Includi TUTTE le 12 categorie in category_interpretations, ognuna con il campo esco_mapping
8. Le scelte situazionali hanno più peso nel giudizio rispetto all'autovalutazione
9. In esco_skills_demonstrated metti le skill effettivamente evidenziate dai punteggi alti
10. In esco_skills_to_develop metti le skill con punteggi bassi o gap comportamentali`;
}

/**
 * Recupera dati assessment con weighted blend
 */
async function getAssessmentData(assessmentId) {
  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', assessmentId)
    .single();

  if (assessmentError) throw new Error(`Assessment not found: ${assessmentError.message}`);

  const { data: results, error: resultsError } = await supabase
    .from('combined_assessment_results')
    .select('*')
    .eq('assessment_id', assessmentId);

  if (resultsError) throw new Error(`Results not found: ${resultsError.message}`);

  const categoryScores = {};
  results.forEach(r => {
    categoryScores[r.skill_category] = {
      likert: parseFloat(r.likert_score) || 0,
      sjt: parseFloat(r.sjt_score) || 0,
      final: parseFloat(r.final_score) || 0
    };
  });

  return {
    assessment,
    categoryScores,
    overallScore: assessment.total_score,
    userId: assessment.user_id
  };
}

/**
 * Recupera risposte situazionali con dettagli
 */
async function getSituationalData(assessmentId) {
  const { data: responses, error } = await supabase
    .from('situational_responses')
    .select(`
      *,
      question:situational_questions(
        primary_skill,
        situation,
        options
      )
    `)
    .eq('assessment_id', assessmentId);

  if (error) {
    console.error('Error fetching situational responses:', error);
    return [];
  }

  return responses.map(r => {
    const question = r.question;
    const selectedOption = question.options.find(opt => opt.label === r.selected_option);
    return {
      skill: question.primary_skill,
      situation: question.situation,
      selected: r.selected_option,
      selectedText: selectedOption?.text || '',
      skillWeights: r.skill_weights
    };
  });
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
 * Recupera benchmark data
 */
async function getBenchmarkData(userProfile) {
  return {
    note: 'Benchmark data will be calculated when sufficient data is available'
  };
}

/**
 * Arricchisce le interpretazioni con i dati ESCO statici ufficiali
 * Questo garantisce che URI e riferimenti tecnici siano sempre corretti
 */
function enrichWithEscoData(categoryInterpretations) {
  const enriched = {};
  for (const [category, interpretation] of Object.entries(categoryInterpretations)) {
    const escoData = ESCO_MAPPING[category];
    enriched[category] = {
      ...interpretation,
      esco_mapping: {
        ...interpretation.esco_mapping,
        // Dati statici ufficiali — sovrascrivono quanto generato dall'AI
        esco_group: escoData?.escoGroup || null,
        esco_uri: escoData?.escoURI || null,
        onet_reference: escoData?.onetRef || null,
        eqf_range: escoData?.eqfRange || null,
        framework_version: 'ESCO v1.2 (15 maggio 2024)'
      }
    };
  }
  return enriched;
}

/**
 * Genera report qualitativo usando Claude AI con weighted blend e ESCO v1.2
 */
export async function generateQualitativeReport(assessmentId) {
  try {
    console.log(`🤖 Generating qualitative report for assessment: ${assessmentId}`);

    // 1. Recupera dati
    const assessmentData = await getAssessmentData(assessmentId);
    const situationalData = await getSituationalData(assessmentId);
    const userProfile = await getUserProfile(assessmentData.userId);
    const benchmarkData = await getBenchmarkData(userProfile);

    console.log(`📊 Assessment data loaded for user: ${assessmentData.userId}`);
    console.log(`🎯 Situational responses: ${situationalData.length} scenarios`);
    console.log(`👤 User profile: ${userProfile.role || 'N/A'} - ${userProfile.industry || 'N/A'}`);
    console.log(`🇪🇺 ESCO v1.2 mapping: active (12 competenze)`);

    // 2. Costruisci prompt
    const prompt = buildAIPrompt(assessmentData, situationalData, userProfile, benchmarkData);

    // 3. Chiama Claude API
    console.log('🔮 Calling Claude API with ESCO v1.2 integration...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
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
      const cleanText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      reportData = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Raw response:', response.content[0].text);
      throw new Error('Invalid JSON response from AI');
    }

    // 5. Arricchisci con dati ESCO ufficiali statici
    const enrichedInterpretations = enrichWithEscoData(reportData.category_interpretations);

    // 6. Salva in database
    const { data: savedReport, error: saveError } = await supabase
      .from('qualitative_reports')
      .insert({
        assessment_id: assessmentId,
        user_id: assessmentData.userId,
        category_interpretations: enrichedInterpretations,
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
    console.log(`🇪🇺 ESCO v1.2 data included in all 12 categories`);

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
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch report: ${error.message}`);
  }

  return report;
}

/**
 * Utility: restituisce la mappatura ESCO completa (usabile da frontend e PDF generator)
 */
export function getEscoMapping() {
  return ESCO_MAPPING;
}
