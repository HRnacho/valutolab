import rateLimit from 'express-rate-limit';

/**
 * Limite stretto per endpoint che inviano email o creano account.
 * Max 10 richieste per IP ogni 15 minuti.
 */
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Troppe richieste. Riprova tra 15 minuti.' }
});

/**
 * Limite standard per endpoint autenticati generici.
 * Max 1000 richieste per IP ogni 15 minuti — include assessment completo,
 * generazione report AI e navigazione risultati senza mai andare in 429.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Troppe richieste. Riprova tra qualche minuto.' }
});
