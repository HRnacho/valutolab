import Anthropic from '@anthropic-ai/sdk';
import db from '../config/database.js';
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
 * Costruisce il prompt per Claude AI con weighted blend, analisi situazionale, ESCO v1.2
 * e personalizzazione tramite userContext (B2C) o logica B2B con hr_notes.
 *
 * @param {object} assessmentData
 * @param {array}  situationalData
 * @param {object} userProfile      — dati da user_profiles (role, industry, seniority)
 * @param {object} benchmarkData
 * @param {object|null} userContext — dati di profilazione raccolti durante l'assessment
 * @param {boolean} isB2B           — true se l'assessment è legato a un'organizzazione
 */
function buildAIPrompt(assessmentData, situationalData, userProfile, benchmarkData, userContext = null, isB2B = false) {
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

  // Contesto di profilazione aggiuntivo (domande di profiling)
  let userContextSection = '';
  if (userContext) {
    const lines = [];
    if (userContext.employment_status) lines.push(`- Situazione lavorativa: ${userContext.employment_status}`);
    if (userContext.years_at_company)  lines.push(`- Anni nell'azienda attuale: ${userContext.years_at_company}`);
    if (userContext.industry)          lines.push(`- Settore dichiarato: ${userContext.industry}`);
    if (userContext.assessment_motivation) lines.push(`- Motivazione all'assessment: ${userContext.assessment_motivation}`);
    if (userContext.development_goals) lines.push(`- Obiettivi di sviluppo dichiarati: ${userContext.development_goals}`);
    if (lines.length > 0) {
      userContextSection = `\nPROFILO DICHIARATO DALL'UTENTE (domande di profilazione):\n${lines.join('\n')}\n`;
    }
  }

  // Sezione hr_notes: solo se B2B (max 3 frasi totali, compatto)
  const hrNotesInstruction = isB2B
    ? `
"hr_notes": {
  "hiring_recommendation": "Consigliato/Da valutare/Non adatto + 1 frase motivazione",
  "fit_for_role": "1 frase sul fit comportamentale per ruolo professionale",
  "risk_flags": ["max 2 aree di rischio brevi"],
  "development_priority_hr": "1 competenza prioritaria da sviluppare in azienda"
}`
    : '';

  const hrNotesRule = isB2B
    ? '\n11. Includi il campo "hr_notes" con la valutazione per l\'HR — questo campo NON viene mostrato al candidato.'
    : '';

  return `Sei un esperto consulente HR specializzato nello sviluppo delle competenze professionali, certificato nel framework europeo ESCO v1.2 (European Skills, Competences, Qualifications and Occupations - Commissione Europea, aggiornato maggio 2024).

CONTESTO UTENTE:
- Ruolo (profilo): ${userProfile.role || 'Professionista'}
- Settore (profilo): ${userProfile.industry || 'Generale'}
- Seniority (profilo): ${userProfile.seniority || 'Mid-level'}
${userContextSection}
PUNTEGGI ASSESSMENT WEIGHTED BLEND (70% Autovalutazione + 30% Comportamentale):
${scoresFormatted}

Punteggio generale finale: ${assessmentData.overallScore != null ? assessmentData.overallScore.toFixed(1) : (assessmentData.categoryScores ? (Object.values(assessmentData.categoryScores).reduce((a, b) => a + b.final, 0) / Object.values(assessmentData.categoryScores).length).toFixed(1) : 'N/A')}/5.0

ANALISI SCELTE SITUAZIONALI:
L'utente ha completato scenari comportamentali che rivelano il suo approccio reale alle situazioni professionali:
${situationalChoices}

FRAMEWORK EUROPEO ESCO v1.2 - RIFERIMENTO:
Scala livelli ESCO:
- Punteggio 1.0-2.0 → Livello Base
- Punteggio 2.1-3.0 → Livello Intermedio
- Punteggio 3.1-4.0 → Livello Avanzato
- Punteggio 4.1-5.0 → Livello Esperto

Mappatura competenze → gruppi ESCO:
${formatEscoForPrompt()}

ISTRUZIONI ANALISI:
1. Personalizza il report in base al contesto dichiarato dall'utente (situazione lavorativa, settore, obiettivi)
2. Analizza ENTRAMBI i tipi di dati: autovalutazione Likert + scelte situazionali comportamentali
3. Identifica GAP tra autopercezione e comportamento effettivo
4. Le scelte situazionali rivelano pattern comportamentali più affidabili dell'autovalutazione
5. Per ogni competenza includi il campo esco_mapping

COMPITO:
Genera un report qualitativo professionale in formato JSON con questa struttura ESATTA:

{
  "category_interpretations": {
    "communication": {
      "score": 4.3,
      "level": "Avanzato",
      "description": "MAX 2 frasi: livello raggiunto + 1 osservazione comportamentale chiave.",
      "strengths": ["punto forza chiave (max 12 parole)", "secondo punto forza (max 12 parole)"],
      "improvements": ["area miglioramento principale (max 12 parole)", "seconda area (max 12 parole)"],
      "behavioral_notes": "1 frase breve sulle scelte situazionali per questa competenza.",
      "contextual_notes": "1-2 frasi: applicazione al contesto dichiarato. Stringa vuota se nessun contesto disponibile.",
      "esco_mapping": {
        "esco_level": "Avanzato",
        "esco_skills_demonstrated": ["skill 1", "skill 2"],
        "esco_skills_to_develop": ["skill da sviluppare"]
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
        "gap_analysis": "1 frase: gap autopercezione vs comportamento reale.",
        "actions": ["Azione 1 con timeline", "Azione 2 con timeline"],
        "resources": ["Risorsa 1"]
      }
    ],
    "timeline": "90 giorni",
    "quick_wins": ["Quick win 1", "Quick win 2"]
  },

  "profile_insights": {
    "summary": "2-3 frasi: sintesi profilo con pattern comportamentali e contesto utente.",
    "patterns": ["Pattern 1 da scelte situazionali", "Pattern 2"],
    "self_awareness": "1 frase: grado di corrispondenza autopercezione/comportamento.",
    "suggested_profile": "Es: Technical Leader, Strategic Thinker",
    "ideal_roles": ["Ruolo 1", "Ruolo 2"],
    "unique_strengths": "1-2 frasi: cosa distingue questo profilo.",
    "esco_profile_summary": "1-2 frasi: aree ESCO padroneggiate e opportunità di crescita."
  }${isB2B ? `,\n\n  ${hrNotesInstruction}` : ''}
}

REGOLE IMPORTANTI:
1. Tono professionale in italiano, specifico e concreto
2. Rispondi SOLO con il JSON valido — NESSUN testo prima o dopo
3. Includi TUTTE le 12 categorie in category_interpretations
4. Le scelte situazionali hanno più peso dell'autovalutazione
5. RISPETTA RIGOROSAMENTE i limiti di lunghezza indicati nella struttura — è critico per non superare il limite di token
6. description: MAX 2 frasi per categoria
7. strengths e improvements: MAX 2 elementi, MAX 12 parole ciascuno
8. behavioral_notes e contextual_notes: MAX 1-2 frasi
9. development_plan: MAX 3 focus_areas, MAX 2 actions ciascuna
10. esco_mapping: NO campo recognition_note${hrNotesRule}`;
}

/**
 * Costruisce il prompt Focus: analisi approfondita sulle sole target_skills.
 */
function buildFocusPrompt(assessmentData, situationalData, userProfile, targetSkills, focusConfig) {
  const scoresFormatted = targetSkills
    .filter(skill => assessmentData.categoryScores[skill])
    .map(skill => {
      const scores = assessmentData.categoryScores[skill];
      const esco = ESCO_MAPPING[skill];
      const escoLevel = getEscoLevel(scores.final);
      const label = categoryLabels[skill] || skill;
      return `  - ${label}:
      • Likert (autovalutazione): ${scores.likert.toFixed(1)}/5.0
      • Situazionale (comportamentale): ${scores.sjt.toFixed(1)}/3.0
      • Punteggio finale (70% Likert + 30% SJT): ${scores.final.toFixed(1)}/5.0
      • ESCO: "${esco?.escoGroup}" → Livello ${escoLevel} | EQF ${esco?.eqfRange}`;
    })
    .join('\n');

  const relevantSituational = situationalData
    .filter(c => targetSkills.includes(c.skill))
    .map(c => `\n[${c.skill}] Situazione: ${c.situation}
Scelta: Opzione ${c.selected} - ${c.selectedText}
Pesi skill: ${JSON.stringify(c.skillWeights)}`)
    .join('\n');

  const roleContext = focusConfig?.description
    ? `\nCONTESTO RUOLO/POSIZIONE:\n"${focusConfig.description}"\n`
    : '';

  const fitnessSection = focusConfig?.description
    ? `
  "fitness_for_role": {
    "role_context": "Riformula brevemente il contesto del ruolo",
    "recommendation": "Consigliato / Da valutare / Non adatto",
    "fit_rationale": "2-3 frasi: come i punteggi si traducono in idoneità al ruolo specifico",
    "gaps": ["gap 1 rispetto al ruolo", "gap 2 rispetto al ruolo"]
  },`
    : '';

  const fitnessRule = focusConfig?.description
    ? '\n7. Includi "fitness_for_role" con valutazione idoneità al ruolo — campo riservato all\'HR.'
    : '';

  const categoryStructure = targetSkills.map(skill => {
    const label = categoryLabels[skill] || skill;
    return `    "${skill}": {
      "score": 0.0,
      "level": "Base/Intermedio/Avanzato/Esperto",
      "description": "3-4 frasi approfondite: livello raggiunto, pattern osservato, coerenza autopercezione/comportamento, implicazioni pratiche.",
      "strengths": ["punto forza 1 (max 15 parole)", "punto forza 2", "punto forza 3"],
      "improvements": ["area miglioramento 1 (max 15 parole)", "area miglioramento 2", "area miglioramento 3"],
      "behavioral_evidence": "2-3 frasi: come le scelte situazionali confermano o contraddicono l'autovalutazione per ${label}.",
      "priority_action": "1 azione concreta e immediata che l'HR può suggerire o monitorare. Es: 'Assegnare un progetto cross-funzionale per sviluppare la gestione dei conflitti in contesti reali.'",
      "esco_mapping": {
        "esco_level": "...",
        "esco_skills_demonstrated": ["skill 1", "skill 2"],
        "esco_skills_to_develop": ["skill da sviluppare"]
      }
    }`;
  }).join(',\n');

  return `Sei un esperto consulente HR specializzato nello sviluppo delle competenze professionali, certificato nel framework europeo ESCO v1.2.

Stai generando un FOCUS ASSESSMENT REPORT — un'analisi approfondita e mirata su ${targetSkills.length} competenze specifiche selezionate dall'azienda per questo candidato.

CONTESTO UTENTE:
- Ruolo (profilo): ${userProfile.role || 'Professionista'}
- Settore (profilo): ${userProfile.industry || 'Generale'}
${roleContext}
COMPETENZE ANALIZZATE (${targetSkills.length}): ${targetSkills.map(s => categoryLabels[s] || s).join(', ')}

PUNTEGGI FOCUS WEIGHTED BLEND (70% Autovalutazione + 30% Comportamentale):
${scoresFormatted}

ANALISI SCELTE SITUAZIONALI RILEVANTI:
${relevantSituational || 'Nessuna risposta situazionale disponibile per queste competenze.'}

SCALA ESCO:
- 1.0-2.0 → Base | 2.1-3.0 → Intermedio | 3.1-4.0 → Avanzato | 4.1-5.0 → Esperto

COMPITO:
Genera un Focus Report in formato JSON con questa struttura ESATTA:

{
  "category_interpretations": {
${categoryStructure}
  },

  "focus_summary": {
    "assessed_skills": ${JSON.stringify(targetSkills)},
    "strongest_skill": "nome_skill",
    "priority_development": "nome_skill_con_gap_maggiore",
    "overall_pattern": "2-3 frasi: pattern trasversale emergente tra le competenze valutate e implicazioni per il profilo professionale."
  },${fitnessSection}

  "hr_notes": {
    "hiring_recommendation": "Consigliato/Da valutare/Non adatto + 1 frase motivazione",
    "fit_for_role": "1 frase sul fit comportamentale per il ruolo",
    "risk_flags": ["max 2 aree di rischio"],
    "development_priority_hr": "1 competenza prioritaria tra quelle valutate"
  }
}

REGOLE:
1. Rispondi SOLO con JSON valido — NESSUN testo prima o dopo
2. Includi SOLO le ${targetSkills.length} competenze specificate in category_interpretations
3. description: 3-4 frasi approfondite (più dettaglio rispetto a un report base)
4. behavioral_evidence: analizza esplicitamente le scelte situazionali per quella competenza
5. priority_action: azione concreta e HR-actionable, non generica${fitnessRule}`;
}

/**
 * Recupera dati assessment con weighted blend
 */
async function getAssessmentData(assessmentId) {
  const { rows: assessmentRows } = await db.query(
    'SELECT * FROM assessments WHERE id = $1',
    [assessmentId]
  );
  if (!assessmentRows[0]) throw new Error(`Assessment not found: ${assessmentId}`);
  const assessment = assessmentRows[0];

  const { rows: results } = await db.query(
    'SELECT * FROM combined_assessment_results WHERE assessment_id = $1',
    [assessmentId]
  );

  const categoryScores = {};
  results.forEach(r => {
    categoryScores[r.skill_category] = {
      likert: parseFloat(r.likert_score) || 0,
      sjt:    parseFloat(r.sjt_score)    || 0,
      final:  parseFloat(r.final_score)  || 0
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
  try {
    const { rows } = await db.query(
      `SELECT sr.*, sq.primary_skill, sq.situation, sq.options, sr.skill_weights
       FROM situational_responses sr
       JOIN situational_questions sq ON sq.id = sr.question_id
       WHERE sr.assessment_id = $1`,
      [assessmentId]
    );

    return rows.map(r => {
      const options = Array.isArray(r.options) ? r.options : JSON.parse(r.options || '[]');
      const selectedOption = options.find(opt => opt.label === r.selected_option);
      return {
        skill:         r.primary_skill,
        situation:     r.situation,
        selected:      r.selected_option,
        selectedText:  selectedOption?.text || '',
        skillWeights:  r.skill_weights
      };
    });
  } catch (err) {
    console.error('Error fetching situational responses:', err);
    return [];
  }
}

/**
 * Recupera profilo utente
 */
async function getUserProfile(userId) {
  try {
    const { rows } = await db.query(
      'SELECT * FROM user_profiles WHERE id = $1',
      [userId]
    );
    return rows[0] ?? { role: null, industry: null, seniority: null };
  } catch (err) {
    console.warn('User profile not found, using defaults');
    return { role: null, industry: null, seniority: null };
  }
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
 * Genera report qualitativo usando Claude AI con weighted blend, ESCO v1.2 e personalizzazione
 * B2C (contextual_notes) / B2B (hr_notes riservato all'HR).
 */
export async function generateQualitativeReport(assessmentId) {
  try {
    console.log(`🤖 Generating qualitative report for assessment: ${assessmentId}`);

    // 1. Recupera dati
    const assessmentData = await getAssessmentData(assessmentId);
    const situationalData = await getSituationalData(assessmentId);
    const userProfile = await getUserProfile(assessmentData.userId);
    const benchmarkData = await getBenchmarkData(userProfile);

    // Detect Focus assessment
    const isFocus = assessmentData.assessment.assessment_type === 'focus';
    const targetSkills = assessmentData.assessment.target_skills ?? [];

    // user_context (profilazione) e organization_id (B2B flag)
    const userContext = assessmentData.assessment.user_context ?? null;
    const isB2B = isFocus || !!assessmentData.assessment.organization_id;

    console.log(`📊 Assessment data loaded for user: ${assessmentData.userId}`);
    console.log(`🎯 Situational responses: ${situationalData.length} scenarios`);
    console.log(`👤 User profile: ${userProfile.role || 'N/A'} - ${userProfile.industry || 'N/A'}`);
    console.log(`🏢 B2B mode: ${isB2B} | Focus: ${isFocus} | Skills: ${targetSkills.join(', ') || 'all'}`);
    console.log(`🇪🇺 ESCO v1.2 mapping: active`);

    // Recupera focus config (per description/nome se presente)
    let focusConfig = null;
    if (isFocus && assessmentData.assessment.focus_config_id) {
      try {
        const { rows: cfgRows } = await db.query(
          'SELECT id, name, description FROM focus_configs WHERE id = $1',
          [assessmentData.assessment.focus_config_id]
        );
        focusConfig = cfgRows[0] ?? null;
        if (focusConfig) console.log(`🔍 Focus config: "${focusConfig.name}"`);
      } catch (err) {
        console.warn('Could not fetch focus config:', err.message);
      }
    }

    // 2. Costruisci prompt
    const prompt = isFocus && targetSkills.length > 0
      ? buildFocusPrompt(assessmentData, situationalData, userProfile, targetSkills, focusConfig)
      : buildAIPrompt(assessmentData, situationalData, userProfile, benchmarkData, userContext, isB2B);

    // 3. Chiama Claude API
    console.log('🔮 Calling Claude API with ESCO v1.2 integration...');
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 7000,
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

    // Per Focus: profile_insights contiene focus_summary + fitness_for_role; development_plan è null
    const profileInsights = isFocus
      ? { focus_summary: reportData.focus_summary, fitness_for_role: reportData.fitness_for_role ?? null }
      : reportData.profile_insights;
    const developmentPlan = isFocus ? null : reportData.development_plan;

    // 6. Salva in database (hr_notes salvato separatamente, mai esposto al candidato via /api/data)
    const { rows: insertRows } = await db.query(
      `INSERT INTO qualitative_reports
         (assessment_id, user_id, category_interpretations,
          development_plan, profile_insights, hr_notes,
          ai_model, generation_tokens)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        assessmentId,
        assessmentData.userId,
        JSON.stringify(enrichedInterpretations),
        developmentPlan ? JSON.stringify(developmentPlan) : null,
        JSON.stringify(profileInsights),
        reportData.hr_notes ? JSON.stringify(reportData.hr_notes) : null,
        'claude-sonnet-4-6',
        response.usage.output_tokens
      ]
    );
    const savedReport = insertRows[0];

    console.log(`💾 Report saved successfully: ${savedReport.id}`);
    if (isFocus) {
      console.log(`🔍 Focus report: ${targetSkills.length} competenze analizzate`);
    } else {
      console.log(`🇪🇺 ESCO v1.2 data included in all 12 categories`);
    }
    if (isB2B && reportData.hr_notes) console.log(`🔒 hr_notes saved (B2B — not exposed to candidate)`);

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
  const { rows } = await db.query(
    'SELECT * FROM qualitative_reports WHERE assessment_id = $1 LIMIT 1',
    [assessmentId]
  );
  return rows[0] ?? null;
}

/**
 * Utility: restituisce la mappatura ESCO completa (usabile da frontend e PDF generator)
 */
export function getEscoMapping() {
  return ESCO_MAPPING;
}
