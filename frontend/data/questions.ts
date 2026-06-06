export const likertScale = [
  { value: 1, label: 'Mai' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'A volte' },
  { value: 4, label: 'Spesso' },
  { value: 5, label: 'Sempre' },
]

export const categoryLabels: Record<string, string> = {
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

export type QuestionType = 'likert' | 'single_choice' | 'textarea'

export interface Question {
  id: number | string
  category: string
  categoryLabel: string
  question: string
  type: QuestionType
  options?: string[]
  conditionalKey?: string   // show only if profilingAnswers[conditionalKey] === conditionalValue
  conditionalValue?: string
}

export const questions: Question[] = [
  // COMUNICAZIONE (1-4)
  { id: 1, type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Riesco a esprimere le mie idee in modo chiaro e comprensibile' },
  { id: 2, type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Ascolto attivamente i miei colleghi durante le conversazioni' },
  { id: 3, type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: "Adatto il mio stile comunicativo in base all'interlocutore" },
  { id: 4, type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Fornisco feedback costruttivo in modo efficace' },

  // LEADERSHIP (5-8)
  { id: 5, type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'So motivare il mio team verso obiettivi comuni' },
  { id: 6, type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Delego responsabilità in modo efficace' },
  { id: 7, type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Prendo decisioni difficili quando necessario' },
  { id: 8, type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Ispiro fiducia nei membri del team' },

  // ── PROFILING 1 ────────────────────────────────────────────────────────────
  {
    id: 'profiling_1',
    type: 'single_choice',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'Qual è la tua situazione lavorativa attuale?',
    options: ['Dipendente', 'Libero professionista', 'Imprenditore / Manager', 'In cerca di occupazione', 'Studente / Neolaureato'],
  },

  // PROBLEM SOLVING (9-12)
  { id: 9, type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Analizzo i problemi da diverse prospettive' },
  { id: 10, type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Trovo soluzioni creative ai problemi complessi' },
  { id: 11, type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Resto calmo sotto pressione quando risolvo problemi' },
  { id: 12, type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Valuto le conseguenze prima di agire' },

  // LAVORO DI SQUADRA (13-16)
  { id: 13, type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Collaboro efficacemente con colleghi diversi' },
  { id: 14, type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Contribuisco attivamente al successo del team' },
  { id: 15, type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Gestisco i conflitti in modo costruttivo' },
  { id: 16, type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Supporto i colleghi quando hanno bisogno di aiuto' },

  // GESTIONE DEL TEMPO (17-20)
  { id: 17, type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Organizzo le mie attività in ordine di priorità' },
  { id: 18, type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Rispetto le scadenze concordate' },
  { id: 19, type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Evito distrazioni durante il lavoro' },
  { id: 20, type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Gestisco efficacemente più progetti contemporaneamente' },

  // ── PROFILING 2 (condizionale: solo se profiling_1 === "Dipendente") ───────
  {
    id: 'profiling_2',
    type: 'single_choice',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: "Da quanti anni lavori nell'azienda attuale?",
    options: ['Meno di 1 anno', '1–3 anni', '3–7 anni', 'Più di 7 anni'],
    conditionalKey: 'profiling_1',
    conditionalValue: 'Dipendente',
  },

  // ADATTABILITÀ (21-24)
  { id: 21, type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: "Mi adatto facilmente ai cambiamenti organizzativi" },
  { id: 22, type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Sono aperto a nuove idee e approcci' },
  { id: 23, type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: "Gestisco bene l'incertezza" },
  { id: 24, type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Imparo rapidamente nuove competenze quando necessario' },

  // CREATIVITÀ (25-28)
  { id: 25, type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Propongo idee innovative per migliorare i processi' },
  { id: 26, type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Penso fuori dagli schemi per risolvere problemi' },
  { id: 27, type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Sperimento nuovi approcci al lavoro' },
  { id: 28, type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Collego concetti diversi per creare soluzioni originali' },

  // ── PROFILING 3 ────────────────────────────────────────────────────────────
  {
    id: 'profiling_3',
    type: 'single_choice',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'In quale settore opera la tua azienda o attività?',
    options: ['Tecnologia / IT', 'Finance / Banking', 'Manifattura / Industria', 'Servizi / Consulenza', 'Pubblica Amministrazione', 'Sanità / Healthcare', 'Retail / E-commerce', 'Altro'],
  },

  // PENSIERO CRITICO (29-32)
  { id: 29, type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Analizzo le informazioni prima di trarre conclusioni' },
  { id: 30, type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Metto in discussione le assunzioni quando necessario' },
  { id: 31, type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Valuto la credibilità delle fonti di informazione' },
  { id: 32, type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Riconosco i bias nei ragionamenti' },

  // EMPATIA (33-36)
  { id: 33, type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Comprendo le emozioni dei miei colleghi' },
  { id: 34, type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Considero i sentimenti altrui nelle mie decisioni' },
  { id: 35, type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Creo un ambiente di lavoro inclusivo' },
  { id: 36, type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Mostro sensibilità verso le diverse prospettive' },

  // RESILIENZA (37-40)
  { id: 37, type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Mi riprendo rapidamente dalle difficoltà' },
  { id: 38, type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Mantengo un atteggiamento positivo nelle avversità' },
  { id: 39, type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Imparo dai miei errori' },
  { id: 40, type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Gestisco lo stress in modo sano' },

  // ── PROFILING 4 ────────────────────────────────────────────────────────────
  {
    id: 'profiling_4',
    type: 'textarea',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'Cosa ti ha spinto a fare questo assessment? (facoltativo)',
  },

  // NEGOZIAZIONE (41-44)
  { id: 41, type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Raggiungo accordi vantaggiosi per tutte le parti' },
  { id: 42, type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Resto professionale durante negoziazioni difficili' },
  { id: 43, type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: "Comprendo i bisogni dell'altra parte" },
  { id: 44, type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Trovo compromessi costruttivi' },

  // DECISION MAKING (45-48)
  { id: 45, type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Prendo decisioni basate su dati e analisi' },
  { id: 46, type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Considero le implicazioni a lungo termine' },
  { id: 47, type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Coinvolgo gli stakeholder nelle decisioni importanti' },
  { id: 48, type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Mi assumo la responsabilità delle mie decisioni' },

  // ── PROFILING 5 (chiusura) ─────────────────────────────────────────────────
  {
    id: 'profiling_5',
    type: 'textarea',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'Quali sono i tuoi principali obiettivi di sviluppo professionale nei prossimi 12 mesi?',
  },
]
