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
  conditionalKey?: string
  conditionalValue?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Domande di profilazione — condivise da tutti i set
// ─────────────────────────────────────────────────────────────────────────────

const profilingQuestions: Question[] = [
  {
    id: 'profiling_1',
    type: 'single_choice',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'Qual è la tua situazione lavorativa attuale?',
    options: ['Dipendente', 'Libero professionista', 'Imprenditore / Manager', 'In cerca di occupazione', 'Studente / Neolaureato'],
  },
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
  {
    id: 'profiling_3',
    type: 'single_choice',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'In quale settore opera la tua azienda o attività?',
    options: ['Tecnologia / IT', 'Finance / Banking', 'Manifattura / Industria', 'Servizi / Consulenza', 'Pubblica Amministrazione', 'Sanità / Healthcare', 'Retail / E-commerce', 'Altro'],
  },
  {
    id: 'profiling_4',
    type: 'textarea',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'Cosa ti ha spinto a fare questo assessment? (facoltativo)',
  },
  {
    id: 'profiling_5',
    type: 'textarea',
    category: 'profiling',
    categoryLabel: 'Profilo',
    question: 'Quali sono i tuoi principali obiettivi di sviluppo professionale nei prossimi 12 mesi?',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// SET A — domande originali (invariate)
// ─────────────────────────────────────────────────────────────────────────────

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
  profilingQuestions[0],

  // PROBLEM SOLVING (9-12)
  { id: 9,  type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Analizzo i problemi da diverse prospettive' },
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

  // ── PROFILING 2 (condizionale) ─────────────────────────────────────────────
  profilingQuestions[1],

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
  profilingQuestions[2],

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
  profilingQuestions[3],

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

  // ── PROFILING 5 ────────────────────────────────────────────────────────────
  profilingQuestions[4],
]

// ─────────────────────────────────────────────────────────────────────────────
// SET B
// ─────────────────────────────────────────────────────────────────────────────

export const questionsSetB: Question[] = [
  // COMUNICAZIONE (b1-b4)
  { id: 'b1', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Quando devo spiegare un concetto complesso, trovo il modo giusto per renderlo comprensibile' },
  { id: 'b2', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: "Durante una riunione ascolto prima di rispondere, anche quando non sono d'accordo" },
  { id: 'b3', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: "Scelgo il canale di comunicazione più appropriato in base al messaggio e all'interlocutore" },
  { id: 'b4', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Quando do un feedback negativo, lo faccio in modo che l\'altro possa migliorare' },

  // LEADERSHIP (b5-b8)
  { id: 'b5', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Riesco a far emergere il meglio dalle persone che lavorano con me' },
  { id: 'b6', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Quando assegno un compito verifico che la persona abbia gli strumenti per svolgerlo' },
  { id: 'b7', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'In situazioni di crisi mi faccio carico delle decisioni necessarie' },
  { id: 'b8', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Le persone del mio team sanno che possono contare su di me' },

  // ── PROFILING 1 ────────────────────────────────────────────────────────────
  profilingQuestions[0],

  // PROBLEM SOLVING (b9-b12)
  { id: 'b9',  type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Quando affronto un problema cerco prima di capirne le cause prima di agire' },
  { id: 'b10', type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Riesco a trovare soluzioni anche quando le risorse disponibili sono limitate' },
  { id: 'b11', type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'In situazioni di pressione mantengo la lucidità necessaria per ragionare' },
  { id: 'b12', type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Prima di implementare una soluzione valuto i possibili effetti collaterali' },

  // TEAMWORK (b13-b16)
  { id: 'b13', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Adatto il mio modo di lavorare per integrarmi con stili diversi dal mio' },
  { id: 'b14', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Metto a disposizione del gruppo le mie competenze senza aspettare di essere richiesto' },
  { id: 'b15', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Quando emergono tensioni nel team cerco di de-escalare prima che si aggravino' },
  { id: 'b16', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Se un collega è in difficoltà mi offro di aiutarlo anche se non è mio compito' },

  // GESTIONE DEL TEMPO (b17-b20)
  { id: 'b17', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Distinguo chiaramente tra ciò che è urgente e ciò che è importante' },
  { id: 'b18', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Quando prevedo di non rispettare una scadenza lo comunico in anticipo' },
  { id: 'b19', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Identifico e riduco le attività che mi fanno perdere tempo durante la giornata' },
  { id: 'b20', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Riesco a mantenere la qualità del lavoro anche quando gestisco più progetti' },

  // ── PROFILING 2 (condizionale) ─────────────────────────────────────────────
  profilingQuestions[1],

  // ADATTABILITÀ (b21-b24)
  { id: 'b21', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Quando cambiano le priorità riorganizo il mio lavoro senza perdere efficienza' },
  { id: 'b22', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Accolgo i feedback critici come opportunità di crescita' },
  { id: 'b23', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Riesco a prendere decisioni anche quando le informazioni disponibili sono incomplete' },
  { id: 'b24', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Quando entro in un contesto nuovo mi integro rapidamente con le sue regole e dinamiche' },

  // CREATIVITÀ (b25-b28)
  { id: 'b25', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Quando un processo non funziona propongo alternative concrete' },
  { id: 'b26', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Guardo a settori o discipline diverse dalla mia per trovare ispirazioni' },
  { id: 'b27', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Metto alla prova nuove idee anche quando non sono sicuro del risultato' },
  { id: 'b28', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Riesco a trovare connessioni tra elementi apparentemente non correlati' },

  // ── PROFILING 3 ────────────────────────────────────────────────────────────
  profilingQuestions[2],

  // PENSIERO CRITICO (b29-b32)
  { id: 'b29', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Distinguo tra i fatti e le interpretazioni quando analizzo una situazione' },
  { id: 'b30', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Quando leggo o ascolto un\'informazione mi chiedo quali interessi possa rappresentare' },
  { id: 'b31', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Prima di prendere una decisione verifico la solidità delle premesse su cui si basa' },
  { id: 'b32', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Riconosco quando le mie emozioni stanno influenzando il mio giudizio' },

  // EMPATIA (b33-b36)
  { id: 'b33', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Riesco a percepire quando un collega sta attraversando un momento difficile anche se non lo dice' },
  { id: 'b34', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Prima di rispondere a qualcuno cerco di capire da dove viene il suo punto di vista' },
  { id: 'b35', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Il mio comportamento contribuisce a creare un ambiente in cui le persone si sentono accolte' },
  { id: 'b36', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Riesco a mettermi nei panni di persone con background molto diverso dal mio' },

  // RESILIENZA (b37-b40)
  { id: 'b37', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Dopo un fallimento riesco a rimettermi in moto in tempi ragionevoli' },
  { id: 'b38', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Nelle fasi difficili mantengo la visione di lungo periodo' },
  { id: 'b39', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Quando sbaglio analizzo l\'errore senza colpevolizzarmi in modo eccessivo' },
  { id: 'b40', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Ho strategie personali efficaci per gestire i momenti di stress intenso' },

  // ── PROFILING 4 ────────────────────────────────────────────────────────────
  profilingQuestions[3],

  // NEGOZIAZIONE (b41-b44)
  { id: 'b41', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'In una trattativa riesco a identificare i reali interessi dell\'altra parte oltre le posizioni dichiarate' },
  { id: 'b42', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Mantengo un approccio costruttivo anche quando la controparte assume posizioni rigide' },
  { id: 'b43', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Riesco a creare valore in una negoziazione trovando soluzioni che soddisfino entrambe le parti' },
  { id: 'b44', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'So quando è il momento giusto per cedere su un punto per ottenere qualcosa di più importante' },

  // DECISION MAKING (b45-b48)
  { id: 'b45', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Quando devo decidere identifico i criteri più rilevanti prima di valutare le opzioni' },
  { id: 'b46', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Considero come una decisione di oggi potrebbe impattare sugli equilibri futuri' },
  { id: 'b47', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Coinvolgo chi sarà impattato da una decisione nel processo che la porta' },
  { id: 'b48', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Una volta presa una decisione la porto avanti anche sotto pressione, salvo nuove evidenze' },

  // ── PROFILING 5 ────────────────────────────────────────────────────────────
  profilingQuestions[4],
]

// ─────────────────────────────────────────────────────────────────────────────
// SET C
// ─────────────────────────────────────────────────────────────────────────────

export const questionsSetC: Question[] = [
  // COMUNICAZIONE (c1-c4)
  { id: 'c1', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Prima di comunicare qualcosa di importante mi assicuro di aver capito bene il messaggio che voglio trasmettere' },
  { id: 'c2', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Quando qualcuno mi parla evito di formulare la risposta nella testa mentre sta ancora parlando' },
  { id: 'c3', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Calibro il livello di dettaglio di una comunicazione in base a chi ho di fronte' },
  { id: 'c4', type: 'likert', category: 'communication', categoryLabel: 'Comunicazione', question: 'Quando ricevo un feedback lo accolgo senza mettermi sulla difensiva' },

  // LEADERSHIP (c5-c8)
  { id: 'c5', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Creo le condizioni perché le persone del mio team possano lavorare al meglio' },
  { id: 'c6', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Quando delego un compito definisco chiaramente obiettivi e autonomia lasciata' },
  { id: 'c7', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Nelle situazioni ambigue prendo posizione anche quando è scomodo farlo' },
  { id: 'c8', type: 'likert', category: 'leadership', categoryLabel: 'Leadership', question: 'Le persone che lavorano con me sanno cosa mi aspetto da loro' },

  // ── PROFILING 1 ────────────────────────────────────────────────────────────
  profilingQuestions[0],

  // PROBLEM SOLVING (c9-c12)
  { id: 'c9',  type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Quando mi trovo di fronte a un problema complesso lo scompongo in parti più gestibili' },
  { id: 'c10', type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Riesco a generare opzioni di soluzione anche in ambiti in cui non sono esperto' },
  { id: 'c11', type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Quando sono sotto pressione il mio processo di ragionamento rimane strutturato' },
  { id: 'c12', type: 'likert', category: 'problem_solving', categoryLabel: 'Problem Solving', question: 'Dopo aver risolto un problema mi chiedo cosa avrei potuto fare meglio' },

  // TEAMWORK (c13-c16)
  { id: 'c13', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Adatto il mio stile relazionale al tipo di persona con cui lavoro' },
  { id: 'c14', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Condivido apertamente informazioni utili con il team anche quando non mi vengono richieste' },
  { id: 'c15', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Quando nascono incomprensioni le affronto direttamente piuttosto che lasciarle sedimentare' },
  { id: 'c16', type: 'likert', category: 'teamwork', categoryLabel: 'Lavoro di Squadra', question: 'Celebro i successi del team tanto quanto i miei' },

  // GESTIONE DEL TEMPO (c17-c20)
  { id: 'c17', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Rivedo regolarmente le mie priorità per assicurarmi di lavorare su ciò che conta davvero' },
  { id: 'c18', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: "Stimo realisticamente il tempo necessario per completare un'attività prima di impegnarmi" },
  { id: 'c19', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Gestisco le interruzioni in modo da non perdere il filo del lavoro importante' },
  { id: 'c20', type: 'likert', category: 'time_management', categoryLabel: 'Gestione del Tempo', question: 'Chiudo le attività completate prima di aprirne di nuove' },

  // ── PROFILING 2 (condizionale) ─────────────────────────────────────────────
  profilingQuestions[1],

  // ADATTABILITÀ (c21-c24)
  { id: 'c21', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Riesco a trovare opportunità anche nei cambiamenti che inizialmente percepisco come negativi' },
  { id: 'c22', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Quando ricevo critiche le valuto nel merito prima di accettarle o respingerle' },
  { id: 'c23', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Mi sento a mio agio nell\'operare in contesti dove le regole non sono ancora definite' },
  { id: 'c24', type: 'likert', category: 'adaptability', categoryLabel: 'Adattabilità', question: 'Aggiorno il mio modo di lavorare quando mi accorgo che quello attuale non funziona più' },

  // CREATIVITÀ (c25-c28)
  { id: 'c25', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Metto in discussione il modo in cui le cose vengono fatte normalmente nel mio ambito' },
  { id: 'c26', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Utilizzo analogie e metafore per avvicinarmi a problemi che non conosco bene' },
  { id: 'c27', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Creo spazio per esplorare idee anche quando la pressione operativa è alta' },
  { id: 'c28', type: 'likert', category: 'creativity', categoryLabel: 'Creatività', question: 'Trasformo intuizioni vaghe in proposte concrete e realizzabili' },

  // ── PROFILING 3 ────────────────────────────────────────────────────────────
  profilingQuestions[2],

  // PENSIERO CRITICO (c29-c32)
  { id: 'c29', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Quando valuto una situazione cerco attivamente evidenze che contraddicano la mia ipotesi iniziale' },
  { id: 'c30', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Distinguo tra ciò che so con certezza e ciò che sto assumendo' },
  { id: 'c31', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Quando una conclusione mi sembra ovvia mi fermo a chiedermi se lo è davvero' },
  { id: 'c32', type: 'likert', category: 'critical_thinking', categoryLabel: 'Pensiero Critico', question: 'Rivaluto le mie posizioni quando emergono nuove informazioni rilevanti' },

  // EMPATIA (c33-c36)
  { id: 'c33', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Riesco a capire il punto di vista di qualcuno anche quando è molto diverso dal mio' },
  { id: 'c34', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Nei momenti di tensione riconosco le emozioni in gioco prima di rispondere' },
  { id: 'c35', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Il mio modo di comunicare tiene conto dell\'impatto che le parole hanno sugli altri' },
  { id: 'c36', type: 'likert', category: 'empathy', categoryLabel: 'Empatia', question: 'Riesco a supportare qualcuno emotivamente senza sentirmi sopraffatto dalla sua situazione' },

  // RESILIENZA (c37-c40)
  { id: 'c37', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Quando le cose non vanno come previsto riorganizo il piano senza perdere la direzione' },
  { id: 'c38', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Riesco a trovare motivazione anche nelle fasi più routinarie o faticose del lavoro' },
  { id: 'c39', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Non lascio che i fallimenti del passato condizionino le mie aspettative future' },
  { id: 'c40', type: 'likert', category: 'resilience', categoryLabel: 'Resilienza', question: 'Ho una buona consapevolezza di quando ho bisogno di staccare per ricaricarmi' },

  // ── PROFILING 4 ────────────────────────────────────────────────────────────
  profilingQuestions[3],

  // NEGOZIAZIONE (c41-c44)
  { id: 'c41', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Prima di entrare in una trattativa preparo le mie priorità e i miei limiti' },
  { id: 'c42', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Riesco a mantenere un tono collaborativo anche quando la negoziazione è tesa' },
  { id: 'c43', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Cerco di ampliare il perimetro della negoziazione quando le posizioni sembrano incompatibili' },
  { id: 'c44', type: 'likert', category: 'negotiation', categoryLabel: 'Negoziazione', question: 'Documento gli accordi raggiunti per evitare fraintendimenti successivi' },

  // DECISION MAKING (c45-c48)
  { id: 'c45', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Distinguo le decisioni reversibili da quelle irreversibili e calibro lo sforzo decisionale di conseguenza' },
  { id: 'c46', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Considero esplicitamente l\'opzione di non decidere come una scelta possibile' },
  { id: 'c47', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Quando una decisione impatta persone diverse mi assicuro di aver considerato tutte le prospettive' },
  { id: 'c48', type: 'likert', category: 'decision_making', categoryLabel: 'Decision Making', question: 'Dopo una decisione importante valuto i risultati per migliorare il mio processo decisionale futuro' },

  // ── PROFILING 5 ────────────────────────────────────────────────────────────
  profilingQuestions[4],
]

// ─────────────────────────────────────────────────────────────────────────────
// Helper — restituisce il set corretto in base a 'A' | 'B' | 'C'
// ─────────────────────────────────────────────────────────────────────────────

export function getQuestionsForSet(set: 'A' | 'B' | 'C'): Question[] {
  switch (set) {
    case 'B': return questionsSetB
    case 'C': return questionsSetC
    default:  return questions
  }
}
