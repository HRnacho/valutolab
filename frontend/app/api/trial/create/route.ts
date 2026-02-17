// FILE: frontend/app/api/trial/create/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;

    const response = await fetch(
      `${backendUrl}/trial/create`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Errore durante la richiesta' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Errore di connessione. Riprova.' },
      { status: 500 }
    );
  }
}
```

Poi vai su **Vercel → Settings → Environment Variables** e aggiungi:
```
Nome:  BACKEND_URL
Valore: https://valutolab-backend.onrender.com/api/v1
