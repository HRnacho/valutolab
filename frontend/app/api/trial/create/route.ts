// =============================================
// FILE: frontend/app/api/trial/create/route.ts
// Questo file fa da "ponte" tra la landing page e il backend
// =============================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Chiama il backend Express
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/trial/create`,
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
