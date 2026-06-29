# CLAUDE.md — ValutoLab

Istruzioni permanenti per Claude Code in questo repo.

---

## Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS — deploy su Vercel (auto su `git push`)
- **Backend**: Express.js ESM (`import/export`), Node.js — deploy su Docker VPS `72.60.35.192`
- **Admin**: `admin-frontend/` è un'app separata, servita dal container `valutolab2-admin-1` — VIVA, distinta dal backend. Non trattarla come codice morto.
- **Database**: PostgreSQL locale nel container `valutolab2-postgres-1`, database `valutolab`
- **AI**: Anthropic SDK, modello `claude-sonnet-4-6`
- **Email**: Resend (`resend.emails.send`), sempre includere campo `text` oltre a `html`

---

## Regole assolute

- **Mai usare Supabase** — il progetto è migrato completamente a PostgreSQL locale. Usa sempre `db.query()` (pg pool).
- **Mai toccare `verifyToken.js`**.
- **Mai modificare il `docker-compose.yml` di produzione** (quello nella root del repo).
- **Il campo `supabase_id` nel JWT è un nome legacy** — contiene l'UUID PostgreSQL locale, non ha nulla a che fare con Supabase.
- Negli endpoint che usano `organization_members`, usare sempre `req.user.supabase_id ?? req.user.id` (i due campi possono divergere).
- I file backend sono ESM: niente `require()`, niente annotazioni di tipo TypeScript (es. `Record<string, number>`) nei `.js`.

---

## Accesso VPS

Claude Code gira sul PC dell'utente ed entra nel VPS via SSH con **chiave già installata (accesso passwordless)**. Può quindi eseguire deploy, restart e lettura log da solo.

- IP: `72.60.35.192` (host `srv967276`), utente `root`
- Root repo sul VPS: `/root/valutolab` (monorepo: `frontend/`, `backend/`, `admin-frontend/`)
- Stack Docker reale (compose): `/docker/valutolab2/docker-compose.yml` (gestito via Hostinger Docker Manager)
- Container: `valutolab2-backend-1` (porta interna 3001), `valutolab2-nginx-1`, `valutolab2-postgres-1`, `valutolab2-adminer-1`, `valutolab2-admin-1`

---

## Query al database (senza Adminer)

Adminer NON è più esposto su internet (bind su `127.0.0.1`, raggiungibile solo via tunnel SSH dell'utente). Per interrogare il DB, Claude Code NON usa Adminer ma `psql` direttamente sul container postgres via SSH.

Connessione interattiva:
```
ssh root@72.60.35.192 "docker exec -it valutolab2-postgres-1 psql -U valutolab -d valutolab"
```

Query singola (consigliata per controlli/debug):
```
ssh root@72.60.35.192 "docker exec valutolab2-postgres-1 psql -U valutolab -d valutolab -c \"SELECT ...\""
```

- Database: `valutolab` — Utente: `valutolab` — Host interno: `valutolab2-postgres-1` — Porta `5432` (non esposta)
- La password NON va nel repo: è nelle env del container (`docker exec valutolab2-postgres-1 env | grep POSTGRES_PASSWORD`).
- Mostrare SEMPRE le query SQL prima di eseguirle se modificano dati o schema; attendere conferma.

---

## Deploy

### Frontend
```
git push origin main
```
Vercel fa il deploy automaticamente.

### Backend (VPS) — eseguibile dal PC via SSH
```
ssh root@72.60.35.192 "cd /root/valutolab && git stash && git pull --rebase origin main && docker restart valutolab2-backend-1"
```
- **Sempre** `git stash` prima del pull per evitare errori di unstaged changes (no-op se non c'è nulla).
- Dopo il deploy, **verificare sempre che il VPS sia allineato** prima di dare per live un fix:
```
ssh root@72.60.35.192 "cd /root/valutolab && git log --oneline -3"
```
  Il VPS resta indietro rispetto a GitHub se il pull non viene eseguito (problema ricorrente).
- Se il sito non risponde dopo un rebuild, il container potrebbe essere uscito dalle reti Docker:
```bash
ssh root@72.60.35.192 "docker network connect --alias backend mautic-1dii_default valutolab2-backend-1"
ssh root@72.60.35.192 "docker network connect valutolab2_default valutolab2-backend-1"
```
- NON usare `docker-compose` per i rebuild — solo `git pull` + `docker restart`.

### Nano editor sul VPS
`Ctrl+X` → `Y` → `Invio`

---

## Architettura assessment

| `assessment_type` | Descrizione |
|---|---|
| `base` | 48 domande Likert (set A/B/C random) + 12 situazionali |
| `focus` | 1-3 competenze × domande da tutti i set A+B+C |
| `leadership` | Leadership Deep Dive — **non toccare** |

- `combined_assessment_results`: tabella (non view), popolata da `PUT /complete`
- Formula punteggio: `final_score = likert * 0.7 + sjt * 0.3`
- `question_set VARCHAR(1)` su `assessments` — randomizzazione set A/B/C per lo stesso utente

---

## Design system

Token Tailwind:
- Background pagina: `bg-paper-100`
- Card/form: `bg-paper-50`, bordo `border-paper-200` o `border-paper-300`
- Testo principale: `text-ink-900` | secondario: `text-ink-400` / `text-ink-500`
- Accento/CTA: `bg-ink-900` o `bg-sienna` (bottone primario)
- Eyebrow label: `text-[11px] font-semibold tracking-widest uppercase text-sienna-600`

Scala colori ESCO (usata in barre, badge, celle tabella):
- 4.1-5.0 → **Esperto** `#1B4332` (verde scuro)
- 3.1-4.0 → **Avanzato** `#2D6A4F` (verde)
- 2.1-3.0 → **Intermedio** `#D4A017` (ambra)
- 1.0-2.0 → **Base** `#C0392B` (rosso)

Componenti UI disponibili: `Wordmark`, `Button`, `ScoreRing` in `@/components/ui/`
Icone: `lucide-react` — niente emoji nei componenti.
Font: `font-body` per testo corrente, `font-display` per titoli.

---

## JWT

- `req.user.id` = `decoded.sub` = ID interno (potrebbe essere un UUID diverso)
- `req.user.supabase_id` = UUID PostgreSQL locale (quello in `users.id` e `organization_members.user_id`)
- Per query su `organization_members`: usare sempre `req.user.supabase_id ?? req.user.id`

---

## File chiave

| File | Ruolo |
|---|---|
| `backend/server-pg.js` | Entry point backend |
| `backend/routes/organizations-pg.js` | Org, inviti, candidati |
| `backend/routes/focus.js` | Focus configs CRUD |
| `backend/routes/data.js` | Assessment, risposte, risultati |
| `backend/routes/share.js` | Profilo pubblico condivisibile |
| `backend/routes/auth.js` | Login, JWT, reset password |
| `backend/services/ai-report-generator.js` | Report AI (base + Focus) |
| `backend/services/valutoLabEmails.js` | Template email transazionali (5 funzioni) |
| `frontend/app/dashboard/page.tsx` | Dashboard personale |
| `frontend/app/aziende/dashboard/page.tsx` | Dashboard HR aziendale |
| `frontend/app/assessment/[id]/page.tsx` | Svolgimento assessment |

---

## Email — pattern di utilizzo

```js
import { NomeFunzione } from '../services/valutoLabEmails.js'
const mail = NomeFunzione({ ...variabili })
await resend.emails.send({
  from: 'ValutoLab <info@valutolab.com>',
  to: destinatario,
  subject: mail.subject,
  html: mail.html,
  text: mail.text   // sempre includere
})
```

In caso di errore email: `try/catch` che loga ma non blocca la response.

---

## Roadmap (stato al 12 giugno 2026)

### Sprint 2 — Priorità alta
1. Report di team aggregato AI per Focus configs
2. Pagina `/trial` B2C migliorata (sezione valore + form)
3. Cancellazione inviti pending dalla dashboard HR

### Sprint 3 — Priorità media
4. Stripe B2C paywall (€29 pagamento unico per sblocco report)
5. Deep Dive competenze per team — bar chart + export PDF

### Pendenze tecniche
- Git divergence VPS/GitHub ricorrente — valutare soluzione strutturale
- `npm audit fix` per 13 vulnerabilità dipendenze
- Test end-to-end completo flusso Focus

### Pendenze di sicurezza
- `POST /api/leadership/start` NON passa da `verifyToken` e si fida dello userId nel body → proteggere con `verifyToken` e prendere lo userId dal token
