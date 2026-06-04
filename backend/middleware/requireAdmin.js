import { createClient } from '@supabase/supabase-js';
import db from '../config/database.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Verifica che la richiesta arrivi da un utente autenticato con is_admin = true.
 * Il frontend deve inviare: Authorization: Bearer <supabase_access_token>
 */
export async function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token di autenticazione mancante' });
  }

  const token = authHeader.slice(7);

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Token non valido o scaduto' });
  }

  const result = await db.query(
    'SELECT is_admin FROM user_profiles WHERE id = $1',
    [user.id]
  );
  if (!result.rows[0]?.is_admin) {
    return res.status(403).json({ success: false, message: 'Accesso riservato agli amministratori' });
  }

  req.adminUser = user;
  next();
}
