/**
 * Middleware centralizzato per la gestione degli errori.
 * - Logga stack trace completo sul server
 * - Restituisce al client solo un messaggio generico (nessun dettaglio tecnico)
 */
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  // Log completo solo lato server
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${status}`, {
    message: err.message,
    stack: err.stack
  });

  // In production non esporre mai dettagli tecnici al client
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction
    ? getGenericMessage(status)
    : err.message;

  res.status(status).json({
    success: false,
    message: clientMessage
  });
}

function getGenericMessage(status) {
  if (status === 400) return 'Richiesta non valida.';
  if (status === 401) return 'Autenticazione richiesta.';
  if (status === 403) return 'Accesso non autorizzato.';
  if (status === 404) return 'Risorsa non trovata.';
  if (status === 429) return 'Troppe richieste. Riprova più tardi.';
  return 'Errore interno del server. Riprova più tardi.';
}
