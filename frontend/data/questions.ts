export interface Question {
  id: number
  category: string
  categoryLabel: string
  question: string
}

export interface LikertOption {
  value: number
  label: string
}

export const likertScale: LikertOption[] = [
  { value: 1, label: 'Mai' },
  { value: 2, label: 'Raramente' },
  { value: 3, label: 'A volte' },
  { value: 4, label: 'Spesso' },
  { value: 5, label: 'Sempre' },
]

export const categories = [
  'communication',
  'leadership',
  'problem_solving',
  'teamwork',
  'time_management',
  'adaptability',
  'creativity',
  'critical_thinking',
  'empathy',
  'resilience',
  'negotiation',
  'decision_making',
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

export const questions: Question[] = [
  // COMUNICAZIONE (1-4)
  {
    id: 1,
    category: 'communication',
    categoryLabel: 'Comunicazione',
    question: 'Riesco a esprimere le mie idee in modo chiaro e comprensibile',
  },
  {
    id: 2,
    category: 'communication',
    categoryLabel: 'Comunicazione',
    question: 'Ascolto attivamente i miei colleghi durante le conversazioni',
  },
  {
    id: 3,
    category: 'communication',
    categoryLabel: 'Comunicazione',
    question: "Adatto il mio stile comunicativo in base all'interlocutore",
  },
  {
    id: 4,
    category: 'communication',
    categoryLabel: 'Comunicazione',
    question: 'Fornisco feedback costruttivo in modo efficace',
  },

  // LEADERSHIP (5-8)
  {
    id: 5,
    category: 'leadership',
    categoryLabel: 'Leadership',
    question: 'So motivare il mio team verso obiettivi comuni',
  },
  {
    id: 6,
    category: 'leadership',
    categoryLabel: 'Leadership',
    question: 'Delego responsabilità in modo efficace',
  },
  {
    id: 7,
    category: 'leadership',
    categoryLabel: 'Leadership',
    question: 'Prendo decisioni difficili quando necessario',
  },
  {
    id: 8,
    category: 'leadership',
    categoryLabel: 'Leadership',
    question: 'Ispiro fiducia nei membri del team',
  },

  // PROBLEM SOLVING (9-12)
  {
    id: 9,
    category: 'problem_solving',
    categoryLabel: 'Problem Solving',
    question: 'Analizzo i problemi da diverse prospettive',
  },
  {
    id: 10,
    category: 'problem_solving',
    categoryLabel: 'Problem Solving',
    question: 'Trovo soluzioni creative ai problemi complessi',
  },
  {
    id: 11,
    category: 'problem_solving',
    categoryLabel: 'Problem Solving',
    question: 'Resto calmo sotto pressione quando risolvo problemi',
  },
  {
    id: 12,
    category: 'problem_solving',
    categoryLabel: 'Problem Solving',
    question: 'Valuto le conseguenze prima di agire',
  },

  // LAVORO DI SQUADRA (13-16)
  {
    id: 13,
    category: 'teamwork',
    categoryLabel: 'Lavoro di Squadra',
    question: 'Collaboro efficacemente con colleghi diversi',
  },
  {
    id: 14,
    category: 'teamwork',
    categoryLabel: 'Lavoro di Squadra',
    question: 'Contribuisco attivamente al successo del team',
  },
  {
    id: 15,
    category: 'teamwork',
    categoryLabel: 'Lavoro di Squadra',
    question: 'Gestisco i conflitti in modo costruttivo',
  },
  {
    id: 16,
    category: 'teamwork',
    categoryLabel: 'Lavoro di Squadra',
    question: 'Supporto i colleghi quando hanno bisogno di aiuto',
  },

  // GESTIONE DEL TEMPO (17-20)
  {
    id: 17,
    category: 'time_management',
    categoryLabel: 'Gestione del Tempo',
    question: 'Organizzo le mie attività in ordine di priorità',
  },
  {
    id: 18,
    category: 'time_management',
    categoryLabel: 'Gestione del Tempo',
    question: 'Rispetto le scadenze concordate',
  },
  {
    id: 19,
    category: 'time_management',
    categoryLabel: 'Gestione del Tempo',
    question: 'Evito distrazioni durante il lavoro',
  },
  {
    id: 20,
    category: 'time_management',
    categoryLabel: 'Gestione del Tempo',
    question: 'Gestisco efficacemente più progetti contemporaneamente',
  },

  // ADATTABILITÀ (21-24)
  {
    id: 21,
    category: 'adaptability',
    categoryLabel: 'Adattabilità',
    question: 'Mi adatto facilmente ai cambiamenti organizzativi',
  },
  {
    id: 22,
    category: 'adaptability',
    categoryLabel: 'Adattabilità',
    question: 'Sono aperto a nuove idee e approcci',
  },
  {
    id: 23,
    category: 'adaptability',
    categoryLabel: 'Adattabilità',
    question: "Gestisco bene l'incertezza",
  },
  {
    id: 24,
    category: 'adaptability',
    categoryLabel: 'Adattabilità',
    question: 'Imparo rapidamente nuove competenze quando necessario',
  },

  // CREATIVITÀ (25-28)
  {
    id: 25,
    category: 'creativity',
    categoryLabel: 'Creatività',
    question: 'Propongo idee innovative per migliorare i processi',
  },
  {
    id: 26,
    category: 'creativity',
    categoryLabel: 'Creatività',
    question: 'Penso fuori dagli schemi per risolvere problemi',
  },
  {
    id: 27,
    category: 'creativity',
    categoryLabel: 'Creatività',
    question: 'Sperimento nuovi approcci al lavoro',
  },
  {
    id: 28,
    category: 'creativity',
    categoryLabel: 'Creatività',
    question: 'Collego concetti diversi per creare soluzioni originali',
  },

  // PENSIERO CRITICO (29-32)
  {
    id: 29,
    category: 'critical_thinking',
    categoryLabel: 'Pensiero Critico',
    question: 'Analizzo le informazioni prima di trarre conclusioni',
  },
  {
    id: 30,
    category: 'critical_thinking',
    categoryLabel: 'Pensiero Critico',
    question: 'Metto in discussione le assunzioni quando necessario',
  },
  {
    id: 31,
    category: 'critical_thinking',
    categoryLabel: 'Pensiero Critico',
    question: 'Valuto la credibilità delle fonti di informazione',
  },
  {
    id: 32,
    category: 'critical_thinking',
    categoryLabel: 'Pensiero Critico',
    question: 'Riconosco i bias nei ragionamenti',
  },

  // EMPATIA (33-36)
  {
    id: 33,
    category: 'empathy',
    categoryLabel: 'Empatia',
    question: 'Comprendo le emozioni dei miei colleghi',
  },
  {
    id: 34,
    category: 'empathy',
    categoryLabel: 'Empatia',
    question: 'Considero i sentimenti altrui nelle mie decisioni',
  },
  {
    id: 35,
    category: 'empathy',
    categoryLabel: 'Empatia',
    question: 'Creo un ambiente di lavoro inclusivo',
  },
  {
    id: 36,
    category: 'empathy',
    categoryLabel: 'Empatia',
    question: 'Mostro sensibilità verso le diverse prospettive',
  },

  // RESILIENZA (37-40)
  {
    id: 37,
    category: 'resilience',
    categoryLabel: 'Resilienza',
    question: 'Mi riprendo rapidamente dalle difficoltà',
  },
  {
    id: 38,
    category: 'resilience',
    categoryLabel: 'Resilienza',
    question: 'Mantengo un atteggiamento positivo nelle avversità',
  },
  {
    id: 39,
    category: 'resilience',
    categoryLabel: 'Resilienza',
    question: 'Imparo dai miei errori',
  },
  {
    id: 40,
    category: 'resilience',
    categoryLabel: 'Resilienza',
    question: 'Gestisco lo stress in modo sano',
  },

  // NEGOZIAZIONE (41-44)
  {
    id: 41,
    category: 'negotiation',
    categoryLabel: 'Negoziazione',
    question: 'Raggiungo accordi vantaggiosi per tutte le parti',
  },
  {
    id: 42,
    category: 'negotiation',
    categoryLabel: 'Negoziazione',
    question: 'Resto professionale durante negoziazioni difficili',
  },
  {
    id: 43,
    category: 'negotiation',
    categoryLabel: 'Negoziazione',
    question: "Comprendo i bisogni dell'altra parte",
  },
  {
    id: 44,
    category: 'negotiation',
    categoryLabel: 'Negoziazione',
    question: 'Trovo compromessi costruttivi',
  },

  // DECISION MAKING (45-48)
  {
    id: 45,
    category: 'decision_making',
    categoryLabel: 'Decision Making',
    question: 'Prendo decisioni basate su dati e analisi',
  },
  {
    id: 46,
    category: 'decision_making',
    categoryLabel: 'Decision Making',
    question: 'Considero le implicazioni a lungo termine',
  },
  {
    id: 47,
    category: 'decision_making',
    categoryLabel: 'Decision Making',
    question: 'Coinvolgo gli stakeholder nelle decisioni importanti',
  },
  {
    id: 48,
    category: 'decision_making',
    categoryLabel: 'Decision Making',
    question: 'Mi assumo la responsabilità delle mie decisioni',
  },
]