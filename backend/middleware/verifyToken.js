import jwt from 'jsonwebtoken';

/**
 * Verifica il JWT custom (non Supabase).
 * Usare su qualsiasi route che richiede un utente autenticato.
 * Attacca req.user = { id, email, role } se il token è valido.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token di autenticazione mancante' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email, role: decoded.role, supabase_id: decoded.supabase_id ?? null };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token scaduto' });
    }
    return res.status(401).json({ success: false, message: 'Token non valido' });
  }
}

/**
 * Come verifyToken ma richiede anche role === 'admin'.
 * Drop-in replacement per requireAdmin nelle route admin.
 */
export function verifyAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accesso riservato agli amministratori' });
    }
    next();
  });
}

/**
 * Token opzionale: non blocca se assente,
 * ma decodifica req.user se presente.
 * Utile per route semi-pubbliche (es. share).
 */
export function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
      req.user = { id: decoded.sub, email: decoded.email, role: decoded.role };
    } catch {
      // token non valido o scaduto — si continua senza utente
    }
  }
  next();
}
