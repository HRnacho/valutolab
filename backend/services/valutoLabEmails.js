/**
 * ValutoLab — Template email transazionali
 * Stili HTML 100% inline, layout table-based per la massima compatibilita.
 *
 * Ogni funzione accetta un oggetto con le variabili e ritorna { subject, html, text }.
 *
 * Esempio (Resend):
 *   import { Resend } from 'resend';
 *   import { resetPassword } from './valutoLabEmails.js';
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   const mail = resetPassword({ fullName: 'Marco Rossi', link: resetUrl, RESET_TOKEN_EXPIRES_H: 2 });
 *   await resend.emails.send({ from: 'ValutoLab <noreply@valutolab.com>', to, subject: mail.subject, html: mail.html, text: mail.text });
 *
 * Email 2 (invito): focusBlock = HTML opzionale (assessment Focus), focusText = versione testuale.
 *   Entrambi default '' -> blocco omesso.
 */

// EMAIL 1 — Reset Password
function resetPassword({ fullName, link, RESET_TOKEN_EXPIRES_H }) {
  return {
    subject: "Reimposta la tua password ValutoLab",
    html: `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Reimposta la tua password ValutoLab</title>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#F5F0E8; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<span style="display:none; font-size:0; line-height:0; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">Reimposta la password del tuo account ValutoLab. Il link &egrave; valido per ${RESET_TOKEN_EXPIRES_H} ore.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

<!-- Header -->
<tr>
<td style="padding:4px 40px 22px 40px; border-bottom:1px solid #D9D0BC;">
<span style="font-family:Arial,Helvetica,sans-serif; font-size:25px; font-weight:bold; color:#1C1917; letter-spacing:-0.4px;">ValutoLab</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:38px 40px 8px 40px;">
<p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#B5541A;">Reimposta password</p>
<h1 style="margin:0 0 22px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:1.3; font-weight:bold; letter-spacing:-0.3px; color:#1C1917;">Reimposta la tua password</h1>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:1.6; color:#1C1917;">Ciao <strong>${fullName}</strong>!</p>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Hai richiesto di reimpostare la password del tuo account ValutoLab. Clicca sul pulsante qui sotto per sceglierne una nuova.</p>
<p style="margin:0 0 28px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.6; color:#78716C;">Per la tua sicurezza, il link &egrave; valido per <strong style="color:#1C1917;">${RESET_TOKEN_EXPIRES_H} ore</strong>.</p>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="#B5541A" style="border-radius:6px;">
<a href="${link}" target="_blank" style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:6px;">Reimposta password &rarr;</a>
</td>
</tr>
</table>

<!-- Fallback link -->
<p style="margin:28px 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; word-break:break-all;"><a href="${link}" target="_blank" style="color:#B5541A; text-decoration:underline;">${link}</a></p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:34px 40px 8px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid #D9D0BC; padding-top:22px;">
<p style="margin:0 0 12px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Se non hai richiesto questo, ignora questa email: la tua password non verr&agrave; modificata.</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:#78716C;">ValutoLab &middot; Analisi qualitativa delle soft skills<br>&copy; 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
    text: `VALUTOLAB

Reimposta la tua password

Ciao ${fullName}!

Hai richiesto di reimpostare la password del tuo account ValutoLab. Apri il link qui sotto per sceglierne una nuova.

Per la tua sicurezza, il link è valido per ${RESET_TOKEN_EXPIRES_H} ore.

Reimposta la password:
${link}

Se non hai richiesto questo, ignora questa email: la tua password non verrà modificata.

—
ValutoLab · Analisi qualitativa delle soft skills
© 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.`,
  };
}

// EMAIL 2 — Invito Assessment
function invitoAssessment({ candidateName, orgName, assessmentUrl, focusBlock = '', focusText = '' }) {
  return {
    subject: "Sei stato invitato a completare un assessment ValutoLab",
    html: `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Sei stato invitato a completare un assessment ValutoLab</title>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#F5F0E8; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<span style="display:none; font-size:0; line-height:0; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">${orgName} ti ha invitato a completare un assessment professionale delle soft skills.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

<!-- Header -->
<tr>
<td style="padding:4px 40px 22px 40px; border-bottom:1px solid #D9D0BC;">
<span style="font-family:Arial,Helvetica,sans-serif; font-size:25px; font-weight:bold; color:#1C1917; letter-spacing:-0.4px;">ValutoLab</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:38px 40px 8px 40px;">
<p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#B5541A;">Invito assessment</p>
<h1 style="margin:0 0 22px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:1.3; font-weight:bold; letter-spacing:-0.3px; color:#1C1917;">Sei stato invitato a un assessment</h1>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:1.6; color:#1C1917;">Ciao <strong>${candidateName}</strong>!</p>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;"><strong>${orgName}</strong> ti ha invitato a completare un assessment professionale delle soft skills.</p>

<!-- ${focusBlock}: blocco opzionale (assessment Focus). Iniettato come HTML grezzo.
     Markup consigliato per restare coerente con lo stile:
     <p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Questo assessment <strong>Focus</strong> &egrave; dedicato a competenze specifiche: <strong>Leadership</strong>, <strong>Comunicazione</strong> e <strong>Problem Solving</strong>.</p>
-->
${focusBlock}

<!-- Info box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 28px 0; background-color:#FFFFFF; border:1px solid #D9D0BC; border-radius:6px;">
<tr>
<td style="padding:22px 24px;">
<p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#78716C;">Cosa ti aspetta</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td width="18" valign="top" style="padding:5px 0;"><div style="width:6px; height:6px; background-color:#B5541A; border-radius:50%; margin-top:7px;"></div></td>
<td valign="top" style="padding:5px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#1C1917;">Domande di autovalutazione</td>
</tr>
<tr>
<td width="18" valign="top" style="padding:5px 0;"><div style="width:6px; height:6px; background-color:#B5541A; border-radius:50%; margin-top:7px;"></div></td>
<td valign="top" style="padding:5px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#1C1917;">Circa 40 minuti per completarlo</td>
</tr>
<tr>
<td width="18" valign="top" style="padding:5px 0;"><div style="width:6px; height:6px; background-color:#B5541A; border-radius:50%; margin-top:7px;"></div></td>
<td valign="top" style="padding:5px 0; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.5; color:#1C1917;">Analisi qualitativa personalizzata</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="#B5541A" style="border-radius:6px;">
<a href="${assessmentUrl}" target="_blank" style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:6px;">Inizia l'Assessment &rarr;</a>
</td>
</tr>
</table>

<!-- Fallback link -->
<p style="margin:28px 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; word-break:break-all;"><a href="${assessmentUrl}" target="_blank" style="color:#B5541A; text-decoration:underline;">${assessmentUrl}</a></p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:34px 40px 8px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid #D9D0BC; padding-top:22px;">
<p style="margin:0 0 12px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Hai ricevuto questa email perch&eacute; <strong style="color:#1C1917;">${orgName}</strong> ti ha invitato tramite ValutoLab.</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:#78716C;">ValutoLab &middot; Analisi qualitativa delle soft skills<br>&copy; 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
    text: `VALUTOLAB

Sei stato invitato a un assessment

Ciao ${candidateName}!

${orgName} ti ha invitato a completare un assessment professionale delle soft skills.
${focusText}
Cosa ti aspetta:
- Domande di autovalutazione
- Circa 40 minuti per completarlo
- Analisi qualitativa personalizzata

Inizia l'assessment:
${assessmentUrl}

Hai ricevuto questa email perché ${orgName} ti ha invitato tramite ValutoLab.

—
ValutoLab · Analisi qualitativa delle soft skills
© 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.`,
  };
}

// EMAIL 3 — Conferma Richiesta Trial B2B
function confermaTrialB2B({ contact_name, company_name }) {
  return {
    subject: "Richiesta Trial ValutoLab Ricevuta",
    html: `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Richiesta Trial ValutoLab Ricevuta</title>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#F5F0E8; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<span style="display:none; font-size:0; line-height:0; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">Abbiamo ricevuto la richiesta di trial per ${company_name}. Riceverai le credenziali entro 24 ore.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

<!-- Header -->
<tr>
<td style="padding:4px 40px 22px 40px; border-bottom:1px solid #D9D0BC;">
<span style="font-family:Arial,Helvetica,sans-serif; font-size:25px; font-weight:bold; color:#1C1917; letter-spacing:-0.4px;">ValutoLab</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:38px 40px 8px 40px;">
<p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#B5541A;">Richiesta ricevuta</p>
<h1 style="margin:0 0 22px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:1.3; font-weight:bold; letter-spacing:-0.3px; color:#1C1917;">Abbiamo ricevuto la tua richiesta</h1>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:1.6; color:#1C1917;">Ciao <strong>${contact_name}</strong>!</p>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Abbiamo ricevuto la richiesta di trial per <strong>${company_name}</strong>.</p>
<p style="margin:0 0 26px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Il nostro team la esaminer&agrave; e riceverai le credenziali di accesso entro <strong>24 ore</strong>.</p>

<!-- Status note -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0; background-color:#FFFFFF; border:1px solid #D9D0BC; border-radius:6px;">
<tr>
<td style="padding:18px 24px; font-family:Arial,Helvetica,sans-serif; font-size:14px; line-height:1.5; color:#78716C;">
<span style="display:inline-block; width:8px; height:8px; background-color:#B5541A; border-radius:50%; margin-right:8px;"></span>Richiesta in fase di revisione &mdash; nessuna azione richiesta da parte tua.
</td>
</tr>
</table>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:34px 40px 8px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid #D9D0BC; padding-top:22px;">
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:#78716C;">ValutoLab &middot; Analisi qualitativa delle soft skills<br>&copy; 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
    text: `VALUTOLAB

Abbiamo ricevuto la tua richiesta

Ciao ${contact_name}!

Abbiamo ricevuto la richiesta di trial per ${company_name}.

Il nostro team la esaminerà e riceverai le credenziali di accesso entro 24 ore. Nessuna azione è richiesta da parte tua.

—
ValutoLab · Analisi qualitativa delle soft skills
© 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.`,
  };
}

// EMAIL 4 — Attivazione Trial B2B
function attivazioneTrialB2B({ contact_name, company_name, quota, expiresAt, activationLink }) {
  return {
    subject: "Il tuo Trial ValutoLab è attivo",
    html: `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Il tuo Trial ValutoLab &egrave; attivo</title>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#F5F0E8; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<span style="display:none; font-size:0; line-height:0; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">Il trial per ${company_name} &egrave; attivo. ${quota} assessment disponibili fino al ${expiresAt}.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

<!-- Header -->
<tr>
<td style="padding:4px 40px 22px 40px; border-bottom:1px solid #D9D0BC;">
<span style="font-family:Arial,Helvetica,sans-serif; font-size:25px; font-weight:bold; color:#1C1917; letter-spacing:-0.4px;">ValutoLab</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:38px 40px 8px 40px;">
<p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#B5541A;">Trial attivo</p>
<h1 style="margin:0 0 22px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:1.3; font-weight:bold; letter-spacing:-0.3px; color:#1C1917;">Il tuo trial &egrave; attivo</h1>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:1.6; color:#1C1917;">Ciao <strong>${contact_name}</strong>!</p>
<p style="margin:0 0 24px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Il trial per <strong>${company_name}</strong> &egrave; attivo. Ecco il riepilogo del tuo piano.</p>

<!-- Summary box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0; background-color:#FFFFFF; border:1px solid #D9D0BC; border-radius:6px;">
<tr>
<td style="padding:22px 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:0 0 14px 0; border-bottom:1px solid #D9D0BC;">
<p style="margin:0 0 3px 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#78716C;">Assessment disponibili</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:19px; font-weight:bold; color:#1C1917;">${quota}</p>
</td>
</tr>
<tr>
<td style="padding:14px 0 0 0;">
<p style="margin:0 0 3px 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#78716C;">Valido fino al</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:19px; font-weight:bold; color:#1C1917;">${expiresAt}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>

<p style="margin:0 0 28px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Clicca qui sotto per impostare la password e accedere. Il link &egrave; valido <strong>72 ore</strong>.</p>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="#B5541A" style="border-radius:6px;">
<a href="${activationLink}" target="_blank" style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:6px;">Attiva il tuo account &rarr;</a>
</td>
</tr>
</table>

<!-- Fallback link -->
<p style="margin:28px 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Se il pulsante non funziona, copia e incolla questo link nel tuo browser:</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; word-break:break-all;"><a href="${activationLink}" target="_blank" style="color:#B5541A; text-decoration:underline;">${activationLink}</a></p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:34px 40px 8px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid #D9D0BC; padding-top:22px;">
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:#78716C;">ValutoLab &middot; Analisi qualitativa delle soft skills<br>&copy; 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
    text: `VALUTOLAB

Il tuo trial è attivo

Ciao ${contact_name}!

Il trial per ${company_name} è attivo. Ecco il riepilogo del tuo piano:

- Assessment disponibili: ${quota}
- Valido fino al: ${expiresAt}

Clicca sul link qui sotto per impostare la password e accedere. Il link è valido 72 ore.

Attiva il tuo account:
${activationLink}

—
ValutoLab · Analisi qualitativa delle soft skills
© 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.`,
  };
}

// EMAIL 5 — Benvenuto Trial B2C
function benvenutoTrialB2C({ full_name, email, password }) {
  return {
    subject: "Il tuo account ValutoLab è pronto",
    html: `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Il tuo account ValutoLab &egrave; pronto</title>
</head>
<body style="margin:0; padding:0; width:100%; background-color:#F5F0E8; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<span style="display:none; font-size:0; line-height:0; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">Il tuo account ValutoLab &egrave; pronto. Hai 1 assessment gratuito valido 30 giorni.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F5F0E8;">
<tr>
<td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">

<!-- Header -->
<tr>
<td style="padding:4px 40px 22px 40px; border-bottom:1px solid #D9D0BC;">
<span style="font-family:Arial,Helvetica,sans-serif; font-size:25px; font-weight:bold; color:#1C1917; letter-spacing:-0.4px;">ValutoLab</span>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:38px 40px 8px 40px;">
<p style="margin:0 0 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#B5541A;">Benvenuto</p>
<h1 style="margin:0 0 22px 0; font-family:Arial,Helvetica,sans-serif; font-size:24px; line-height:1.3; font-weight:bold; letter-spacing:-0.3px; color:#1C1917;">Il tuo account &egrave; pronto</h1>
<p style="margin:0 0 18px 0; font-family:Arial,Helvetica,sans-serif; font-size:17px; line-height:1.6; color:#1C1917;">Ciao <strong>${full_name}</strong>!</p>
<p style="margin:0 0 24px 0; font-family:Arial,Helvetica,sans-serif; font-size:16px; line-height:1.6; color:#1C1917;">Il tuo account &egrave; stato creato. Hai <strong>1 assessment gratuito</strong> valido 30 giorni.</p>

<!-- Credentials box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 26px 0; background-color:#FFFFFF; border:1px solid #D9D0BC; border-radius:6px;">
<tr>
<td style="padding:22px 24px;">
<p style="margin:0 0 16px 0; font-family:Arial,Helvetica,sans-serif; font-size:11px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#78716C;">Le tue credenziali</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td style="padding:0 0 14px 0; border-bottom:1px solid #D9D0BC;">
<p style="margin:0 0 4px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#78716C;">Email</p>
<p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:15px; color:#1C1917; word-break:break-all;">${email}</p>
</td>
</tr>
<tr>
<td style="padding:14px 0 0 0;">
<p style="margin:0 0 4px 0; font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#78716C;">Password</p>
<p style="margin:0; font-family:'Courier New',Courier,monospace; font-size:15px; color:#1C1917; letter-spacing:0.5px;">${password}</p>
</td>
</tr>
</table>
</td>
</tr>
</table>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" bgcolor="#B5541A" style="border-radius:6px;">
<a href="https://valutolab.com/login" target="_blank" style="display:inline-block; font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#FFFFFF; text-decoration:none; padding:14px 32px; border-radius:6px;">Inizia il tuo Assessment &rarr;</a>
</td>
</tr>
</table>

<!-- Fallback link -->
<p style="margin:28px 0 6px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Oppure accedi da:</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; word-break:break-all;"><a href="https://valutolab.com/login" target="_blank" style="color:#B5541A; text-decoration:underline;">https://valutolab.com/login</a></p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="padding:34px 40px 8px 40px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="border-top:1px solid #D9D0BC; padding-top:22px;">
<p style="margin:0 0 12px 0; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:1.6; color:#78716C;">Ti consigliamo di cambiare la password al primo accesso.</p>
<p style="margin:0; font-family:Arial,Helvetica,sans-serif; font-size:12px; line-height:1.6; color:#78716C;">ValutoLab &middot; Analisi qualitativa delle soft skills<br>&copy; 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.</p>
</td></tr>
</table>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>
`,
    text: `VALUTOLAB

Il tuo account è pronto

Ciao ${full_name}!

Il tuo account è stato creato. Hai 1 assessment gratuito valido 30 giorni.

Le tue credenziali:
- Email: ${email}
- Password: ${password}

Ti consigliamo di cambiare la password al primo accesso.

Inizia il tuo assessment:
https://valutolab.com/login

—
ValutoLab · Analisi qualitativa delle soft skills
© 2026 ValutoLab. Email automatica, ti preghiamo di non rispondere.`,
  };
}

export {
  resetPassword,
  invitoAssessment,
  confermaTrialB2B,
  attivazioneTrialB2B,
  benvenutoTrialB2C,
};
