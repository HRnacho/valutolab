/**
 * Callback OAuth Google — riceve i JWT dal backend e li salva in localStorage.
 * Il backend redirige qui con ?access_token=...&refresh_token=...
 * Non usa più Supabase.
 */
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url    = new URL(request.url);
  const error  = url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${url.origin}/login?error=${error}`);
  }

  const accessToken  = url.searchParams.get('access_token');
  const refreshToken = url.searchParams.get('refresh_token');

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_tokens`);
  }

  // Salva i token via pagina HTML inline (localStorage non è accessibile nei Route Handler)
  const html = `<!DOCTYPE html>
<html>
<head><title>Accesso in corso...</title></head>
<body>
<script>
  try {
    localStorage.setItem('jwt_access_token',  '${accessToken}');
    localStorage.setItem('jwt_refresh_token', '${refreshToken}');
    window.location.replace('/dashboard');
  } catch(e) {
    window.location.replace('/login?error=storage_error');
  }
</script>
<p>Reindirizzamento in corso...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
