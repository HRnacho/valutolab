-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: domande situazionali Set B e Set C
-- Eseguire su VPS: docker exec -i valutolab2-postgres-1 psql -U valutolab -d valutolab < seed-situational-sets-bc.sql
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- SET B
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO situational_questions (id, question_set, primary_skill, display_order, situation, options, is_active) VALUES
(gen_random_uuid(), 'B', 'communication', 1,
 'Durante una riunione presenti un progetto importante. Un collega senior ti interrompe ripetutamente con obiezioni. Come reagisci?',
 '[
   {"label":"A","text":"Lo ignoro e continuo la presentazione","skill_weights":{"resilience":2,"communication":1,"decision_making":1}},
   {"label":"B","text":"Mi fermo, lo ringrazio per l''input e gli chiedo di permettermi di finire prima di rispondere","skill_weights":{"communication":3,"empathy":2,"negotiation":1}},
   {"label":"C","text":"Rispondo punto per punto a ogni interruzione per dimostrare la solidità del progetto","skill_weights":{"communication":2,"critical_thinking":1,"decision_making":1}},
   {"label":"D","text":"Abbrevio la presentazione per evitare ulteriori tensioni","skill_weights":{"adaptability":2,"communication":1,"resilience":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'leadership', 2,
 'Il tuo team deve consegnare un deliverable importante entro venerdì. Il martedì scopri che un membro chiave è in difficoltà e rischia di non finire la sua parte. Cosa fai?',
 '[
   {"label":"A","text":"Lo sostituisco immediatamente con qualcun altro","skill_weights":{"decision_making":2,"leadership":1}},
   {"label":"B","text":"Parlo con lui per capire dove è bloccato e vedo come supportarlo o redistribuire il carico","skill_weights":{"leadership":3,"empathy":2,"teamwork":1}},
   {"label":"C","text":"Aspetto fino a giovedì prima di intervenire, potrebbe risolvere da solo","skill_weights":{"resilience":1,"leadership":1}},
   {"label":"D","text":"Informo subito il cliente che potremmo ritardare","skill_weights":{"communication":2,"leadership":1,"decision_making":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'problem_solving', 3,
 'Un processo che gestisci da mesi smette improvvisamente di funzionare. Non hai documentazione e il collega che lo aveva sviluppato non è disponibile. Come procedi?',
 '[
   {"label":"A","text":"Aspetto che il collega torni disponibile prima di fare qualsiasi cosa","skill_weights":{"resilience":1,"problem_solving":1}},
   {"label":"B","text":"Ricostruisco il processo da zero partendo dagli output attesi e testando passo per passo","skill_weights":{"problem_solving":2,"critical_thinking":2,"resilience":1}},
   {"label":"C","text":"Segnalo immediatamente al responsabile che non posso procedere senza supporto","skill_weights":{"communication":2,"teamwork":1}},
   {"label":"D","text":"Applico una soluzione temporanea per tamponare e nel frattempo analizzo il problema in profondità","skill_weights":{"problem_solving":3,"adaptability":2,"decision_making":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'teamwork', 4,
 'In un progetto di gruppo noti che due colleghi hanno approcci molto diversi e questo sta creando rallentamenti. Non sei il responsabile del team. Cosa fai?',
 '[
   {"label":"A","text":"Non è un mio problema, mi concentro sulla mia parte","skill_weights":{"time_management":1,"decision_making":1}},
   {"label":"B","text":"Ne parlo privatamente con entrambi per capire le rispettive posizioni e vedere se posso facilitare","skill_weights":{"empathy":2,"communication":2,"teamwork":2}},
   {"label":"C","text":"Lo segnalo al responsabile del team perché intervenga","skill_weights":{"communication":1,"leadership":1,"teamwork":1}},
   {"label":"D","text":"Propongo al team una riunione per allinearsi sul metodo di lavoro","skill_weights":{"teamwork":3,"leadership":2,"communication":2}}
 ]',
 true),

(gen_random_uuid(), 'B', 'time_management', 5,
 'Hai tre scadenze ravvicinate e ricevi una richiesta urgente non pianificata dal tuo responsabile. Come gestisci la situazione?',
 '[
   {"label":"A","text":"Accetto la richiesta e lavoro straordinari per fare tutto","skill_weights":{"resilience":2,"time_management":1}},
   {"label":"B","text":"Rifiuto la richiesta perché ho già troppo da fare","skill_weights":{"decision_making":1,"time_management":1}},
   {"label":"C","text":"Condivido con il responsabile il quadro delle priorità attuali e decidiamo insieme cosa spostare","skill_weights":{"time_management":3,"communication":2,"decision_making":1}},
   {"label":"D","text":"Delego una delle scadenze esistenti a un collega per liberare spazio","skill_weights":{"leadership":2,"time_management":2,"teamwork":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'adaptability', 6,
 'A metà progetto l''azienda decide di cambiare completamente l''approccio. Il lavoro fatto finora diventa inutilizzabile. Come reagisci?',
 '[
   {"label":"A","text":"Esprimo la mia frustrazione al team e al responsabile","skill_weights":{"communication":1,"resilience":1}},
   {"label":"B","text":"Chiedo una spiegazione del cambiamento per capirne la logica, poi mi rimetto in moto con energia","skill_weights":{"adaptability":3,"resilience":2,"communication":1}},
   {"label":"C","text":"Continuo a lavorare come prima sperando che il cambiamento venga rivisto","skill_weights":{"resilience":1,"adaptability":1}},
   {"label":"D","text":"Accetto il cambiamento senza fare domande e ricomincio da zero","skill_weights":{"adaptability":2,"resilience":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'creativity', 7,
 'Devi trovare un modo per aumentare il coinvolgimento del team in riunioni che tutti trovano noiose e poco produttive. Cosa proponi?',
 '[
   {"label":"A","text":"Suggerisco di ridurre la frequenza delle riunioni","skill_weights":{"time_management":2,"decision_making":1}},
   {"label":"B","text":"Propongo di introdurre un formato diverso: obiettivo chiaro, durata fissa, rotazione del facilitatore","skill_weights":{"creativity":3,"leadership":2,"problem_solving":1}},
   {"label":"C","text":"Propongo di eliminare le riunioni e passare tutto via email","skill_weights":{"decision_making":2,"creativity":1}},
   {"label":"D","text":"Suggerisco di coinvolgere un consulente esterno per ridisegnare il processo","skill_weights":{"leadership":1,"decision_making":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'critical_thinking', 8,
 'Il tuo responsabile ti presenta dati che supportano una decisione strategica. I numeri sembrano convincenti ma qualcosa non ti torna. Come ti comporti?',
 '[
   {"label":"A","text":"Accetto i dati senza fare domande — il responsabile ha più contesto di me","skill_weights":{"teamwork":1,"leadership":1}},
   {"label":"B","text":"Chiedo gentilmente quali fonti sono state usate e come sono stati elaborati i dati","skill_weights":{"critical_thinking":2,"communication":2,"teamwork":1}},
   {"label":"C","text":"Esprimo pubblicamente i miei dubbi davanti al team","skill_weights":{"critical_thinking":2,"communication":1}},
   {"label":"D","text":"Faccio una verifica indipendente prima di esprimere qualsiasi opinione","skill_weights":{"critical_thinking":3,"problem_solving":2,"decision_making":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'empathy', 9,
 'Un collega che di solito è molto produttivo sembra demotivato da settimane. Il suo lavoro ne sta risentendo. Come ti comporti?',
 '[
   {"label":"A","text":"Lo ignoro — le questioni personali non riguardano il lavoro","skill_weights":{"time_management":1}},
   {"label":"B","text":"Lo avvicino in modo informale per chiedergli come sta, senza pressione","skill_weights":{"empathy":3,"communication":2,"teamwork":1}},
   {"label":"C","text":"Lo segnalo al responsabile perché intervenga","skill_weights":{"leadership":1,"teamwork":1,"communication":1}},
   {"label":"D","text":"Gli invio un messaggio scritto per dirgli che ho notato il cambiamento e che sono disponibile","skill_weights":{"empathy":2,"communication":2}}
 ]',
 true),

(gen_random_uuid(), 'B', 'resilience', 10,
 'Presenti un progetto su cui hai lavorato mesi. Viene bocciato con critiche pesanti. Come gestisci la situazione?',
 '[
   {"label":"A","text":"Difendo il progetto punto per punto — sono convinto del suo valore","skill_weights":{"communication":2,"resilience":1,"decision_making":1}},
   {"label":"B","text":"Ascolto tutte le critiche, chiedo chiarimenti dove non capisco, poi mi prendo del tempo per rielaborare","skill_weights":{"resilience":3,"critical_thinking":2,"empathy":1}},
   {"label":"C","text":"Accetto le critiche in silenzio ma interiormente rimango convinto che abbiano torto","skill_weights":{"resilience":1,"adaptability":1}},
   {"label":"D","text":"Chiedo immediatamente come posso modificarlo per renderlo accettabile","skill_weights":{"adaptability":2,"communication":1,"resilience":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'negotiation', 11,
 'Stai negoziando le condizioni di un contratto con un fornitore. Ha una posizione rigida su un punto chiave per te. Come procedi?',
 '[
   {"label":"A","text":"Cedo su quel punto per chiudere rapidamente","skill_weights":{"adaptability":2,"negotiation":1}},
   {"label":"B","text":"Alzo la voce per far capire che quella condizione è non negoziabile","skill_weights":{"resilience":1,"decision_making":1}},
   {"label":"C","text":"Cerco di capire perché tiene così tanto a quella posizione e propongo alternative che soddisfino il suo interesse sottostante","skill_weights":{"negotiation":3,"empathy":2,"communication":2}},
   {"label":"D","text":"Interrompo la negoziazione e valuto altri fornitori","skill_weights":{"decision_making":3,"adaptability":1}}
 ]',
 true),

(gen_random_uuid(), 'B', 'decision_making', 12,
 'Devi scegliere tra due fornitori: uno più economico ma con referenze incerte, uno più costoso ma affidabile. Il budget è under pressure. Come decidi?',
 '[
   {"label":"A","text":"Scelgo il più economico — il budget è la priorità","skill_weights":{"decision_making":1,"time_management":1}},
   {"label":"B","text":"Chiedo referenze aggiuntive al fornitore economico prima di decidere","skill_weights":{"decision_making":2,"critical_thinking":2,"communication":1}},
   {"label":"C","text":"Propongo al responsabile di rivedere il budget per scegliere quello affidabile","skill_weights":{"negotiation":2,"leadership":1,"communication":1}},
   {"label":"D","text":"Valuto il rischio di ciascuna opzione in termini di costo potenziale di un fallimento e scelgo in base a quello","skill_weights":{"decision_making":3,"critical_thinking":2,"problem_solving":1}}
 ]',
 true);

-- ─────────────────────────────────────────────────────────────────────────────
-- SET C
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO situational_questions (id, question_set, primary_skill, display_order, situation, options, is_active) VALUES
(gen_random_uuid(), 'C', 'communication', 1,
 'Devi comunicare a un cliente un ritardo significativo su un deliverable atteso. Il cliente è già teso per altri motivi. Come gestisci la comunicazione?',
 '[
   {"label":"A","text":"Mando una email sintetica con i fatti essenziali evitando dettagli che potrebbero irritarlo","skill_weights":{"communication":2,"decision_making":1}},
   {"label":"B","text":"Lo chiamo, spiego la situazione con trasparenza, indico la nuova data e cosa stiamo facendo per evitare che si ripeta","skill_weights":{"communication":3,"empathy":2,"resilience":1}},
   {"label":"C","text":"Aspetto di avere la nuova data confermata prima di comunicare qualsiasi cosa","skill_weights":{"decision_making":1,"time_management":1}},
   {"label":"D","text":"Delego la comunicazione al mio responsabile per evitare tensioni dirette","skill_weights":{"leadership":1,"communication":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'leadership', 2,
 'Hai un membro del team molto capace ma che tende a lavorare in silo senza condividere con gli altri. Il team ne risente. Come intervieni?',
 '[
   {"label":"A","text":"Lo segnalo al responsabile come un problema da gestire","skill_weights":{"leadership":1,"communication":1}},
   {"label":"B","text":"Gli assegno task che lo obbligano a collaborare con altri","skill_weights":{"leadership":2,"teamwork":2}},
   {"label":"C","text":"Ho una conversazione diretta con lui per fargli capire l''impatto del suo comportamento sul team e allinearlo su aspettative diverse","skill_weights":{"leadership":3,"communication":2,"empathy":1}},
   {"label":"D","text":"Lascio perdere — è molto capace e non voglio rischiare di perderlo","skill_weights":{"decision_making":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'problem_solving', 3,
 'Un cliente segnala un problema urgente sul tuo prodotto. Non riesci a replicarlo internamente ma il cliente dice che è sistematico. Come procedi?',
 '[
   {"label":"A","text":"Dico al cliente che non riesco a replicare il problema quindi probabilmente è un errore suo","skill_weights":{"communication":1}},
   {"label":"B","text":"Chiedo al cliente di documentare i passi esatti per replicarlo e nel frattempo indago in parallelo le possibili cause","skill_weights":{"problem_solving":2,"communication":2,"teamwork":1}},
   {"label":"C","text":"Scala immediatamente al team tecnico senior senza fare ulteriori indagini","skill_weights":{"leadership":1,"teamwork":1,"communication":1}},
   {"label":"D","text":"Fornisco una workaround temporanea al cliente e mi prendo il tempo necessario per investigare correttamente","skill_weights":{"problem_solving":3,"communication":2,"decision_making":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'teamwork', 4,
 'Stai lavorando a un progetto con un collega con cui hai avuto in passato dei contrasti. Il progetto è importante. Come approcci la collaborazione?',
 '[
   {"label":"A","text":"Mantengo un rapporto formale e professionale limitando al minimo le interazioni","skill_weights":{"time_management":1,"resilience":1}},
   {"label":"B","text":"Prima di iniziare il progetto propongo un chiarimento diretto sui contrasti passati per partire con una base pulita","skill_weights":{"teamwork":3,"communication":2,"resilience":1}},
   {"label":"C","text":"Ignoro il passato e lavoro come se non fosse successo niente","skill_weights":{"adaptability":2,"resilience":1}},
   {"label":"D","text":"Chiedo al responsabile di riorganizzare il team per evitare la collaborazione diretta","skill_weights":{"decision_making":1,"communication":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'time_management', 5,
 'Noti che stai trascorrendo molto tempo in riunioni che spesso non richiedono la tua presenza attiva. Come gestisci la situazione?',
 '[
   {"label":"A","text":"Partecipo a tutte — meglio esserci che mancare qualcosa di importante","skill_weights":{"teamwork":1,"time_management":1}},
   {"label":"B","text":"Analizzo quali riunioni richiedono davvero la mia presenza e propongo di essere coinvolto solo nelle decisioni che mi riguardano direttamente","skill_weights":{"time_management":3,"communication":2,"decision_making":1}},
   {"label":"C","text":"Smetto di partecipare alle riunioni che ritengo inutili senza comunicarlo","skill_weights":{"time_management":2,"decision_making":1}},
   {"label":"D","text":"Partecipo ma nel frattempo lavoro ad altro per recuperare il tempo perso","skill_weights":{"time_management":1,"adaptability":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'adaptability', 6,
 'Vieni assegnato a un progetto in un settore che non conosci. I tuoi colleghi hanno anni di esperienza nel campo. Come ti inserisci?',
 '[
   {"label":"A","text":"Cerco di non emergere finché non conosco abbastanza il contesto","skill_weights":{"resilience":1,"adaptability":1}},
   {"label":"B","text":"Dichiaro apertamente il mio livello di conoscenza, faccio molte domande e contribuisco con le competenze che ho","skill_weights":{"adaptability":3,"communication":2,"teamwork":1}},
   {"label":"C","text":"Fingo di sapere più di quanto so per non apparire inadeguato","skill_weights":{"resilience":1,"communication":1}},
   {"label":"D","text":"Chiedo un periodo di affiancamento prima di contribuire attivamente","skill_weights":{"adaptability":2,"teamwork":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'creativity', 7,
 'Il tuo team è bloccato su un problema da settimane senza trovare una soluzione soddisfacente. Sei in riunione. Cosa proponi?',
 '[
   {"label":"A","text":"Suggerisco di portare il problema a qualcuno di esterno al team che ha più esperienza","skill_weights":{"leadership":1,"creativity":1,"teamwork":1}},
   {"label":"B","text":"Propongo di cambiare completamente la prospettiva: definire il problema opposto e vedere cosa emerge","skill_weights":{"creativity":3,"critical_thinking":2}},
   {"label":"C","text":"Suggerisco di prendere una pausa e riprendere la settimana successiva con la mente fresca","skill_weights":{"resilience":2,"time_management":1}},
   {"label":"D","text":"Propongo di raccogliere casi simili da altri settori e vedere se ci sono pattern applicabili","skill_weights":{"creativity":3,"problem_solving":2,"critical_thinking":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'critical_thinking', 8,
 'Ricevi un report con dati molto positivi sul lancio di un nuovo prodotto. Tutti nel team sono entusiasti. Cosa fai?',
 '[
   {"label":"A","text":"Condivido l''entusiasmo — i dati parlano chiaro","skill_weights":{"teamwork":2,"empathy":1}},
   {"label":"B","text":"Chiedo come sono stati raccolti i dati, quale è il campione e se ci sono indicatori meno positivi non inclusi nel report","skill_weights":{"critical_thinking":3,"communication":2,"decision_making":1}},
   {"label":"C","text":"Esprimo i miei dubbi pubblicamente per smorzare gli entusiasmi prematuri","skill_weights":{"critical_thinking":2,"communication":1}},
   {"label":"D","text":"Attendo i dati del mese successivo prima di esprimere una valutazione","skill_weights":{"decision_making":2,"critical_thinking":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'empathy', 9,
 'Durante una revisione di progetto un collega viene criticato duramente di fronte a tutto il team. Noti che è visibilmente a disagio. Cosa fai?',
 '[
   {"label":"A","text":"Non intervengo — non è mio compito gestire le dinamiche interpersonali","skill_weights":{"time_management":1,"decision_making":1}},
   {"label":"B","text":"Reindirizzo la conversazione su come risolvere il problema piuttosto che su chi ha sbagliato","skill_weights":{"empathy":3,"leadership":2,"communication":1}},
   {"label":"C","text":"Prendo le difese del collega esplicitamente","skill_weights":{"empathy":2,"communication":1,"resilience":1}},
   {"label":"D","text":"Dopo la riunione lo avvicino per verificare come sta","skill_weights":{"empathy":2,"teamwork":2}}
 ]',
 true),

(gen_random_uuid(), 'C', 'resilience', 10,
 'Sei in un periodo di lavoro particolarmente intenso da mesi. Cominci a sentire i segnali di affaticamento. Come gestisci la situazione?',
 '[
   {"label":"A","text":"Continuo a spingere — le scadenze non aspettano","skill_weights":{"resilience":1,"time_management":1}},
   {"label":"B","text":"Riconosco i segnali, parlo con il mio responsabile della situazione e propongo insieme come ridistribuire il carico o creare spazio di recupero","skill_weights":{"resilience":3,"communication":2,"decision_making":1}},
   {"label":"C","text":"Prendo ferie senza preavviso quando non ce la faccio più","skill_weights":{"resilience":1,"communication":1}},
   {"label":"D","text":"Riduco autonomamente la qualità del lavoro per reggere i ritmi","skill_weights":{"adaptability":1,"resilience":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'negotiation', 11,
 'Stai trattando un aumento con il tuo responsabile. Ti offre meno di quello che ritieni adeguato. Come procedi?',
 '[
   {"label":"A","text":"Accetto per non creare tensioni","skill_weights":{"teamwork":1,"adaptability":1}},
   {"label":"B","text":"Presento dati concreti sul valore che porto, il confronto con il mercato e propongo una cifra specifica motivandola","skill_weights":{"negotiation":3,"communication":2,"critical_thinking":1}},
   {"label":"C","text":"Minaccio di cercare altre opportunità se non viene migliorata l''offerta","skill_weights":{"resilience":1,"decision_making":1,"negotiation":1}},
   {"label":"D","text":"Chiedo tempo per pensarci senza dare una risposta immediata","skill_weights":{"decision_making":2,"negotiation":1}}
 ]',
 true),

(gen_random_uuid(), 'C', 'decision_making', 12,
 'Devi scegliere tra continuare un progetto che sta dando risultati sotto le aspettative o interromperlo. Hai investito molto tempo e risorse. Come decidi?',
 '[
   {"label":"A","text":"Continuo — abbandonare ora significherebbe sprecare tutto quello che abbiamo investito","skill_weights":{"resilience":2,"leadership":1}},
   {"label":"B","text":"Valuto oggettivamente le prospettive future indipendentemente da quanto è già stato investito e decido in base a quello","skill_weights":{"decision_making":3,"critical_thinking":2,"problem_solving":1}},
   {"label":"C","text":"Chiedo al team di votare — è una decisione che riguarda tutti","skill_weights":{"leadership":2,"teamwork":2,"empathy":1}},
   {"label":"D","text":"Aspetto ancora un mese prima di decidere per avere più dati","skill_weights":{"decision_making":1,"resilience":1}}
 ]',
 true);

COMMIT;

-- Verifica
SELECT question_set, COUNT(*) AS totale
FROM situational_questions
GROUP BY question_set
ORDER BY question_set;
