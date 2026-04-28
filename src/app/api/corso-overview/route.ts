import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { courseName, universita, tipo, classe, lingua, area } = await req.json();

  const prompt = `Sei un esperto di orientamento universitario italiano. Scrivi una panoramica di circa 150 parole del seguente corso per aiutare uno studente liceale a capire se fa per lui.

Corso: ${courseName}
Università: ${universita}
Tipo: ${tipo}
Classe di laurea: ${classe || 'non specificata'}
Lingua: ${lingua || 'Italiano'}
Area: ${area || 'non specificata'}

Includi in modo fluido: cosa si studia concretamente, quali competenze si sviluppano, a chi è più adatto, 2-3 sbocchi professionali principali. Tono diretto e utile per un diciassettenne. Niente titoli o elenchi, solo prosa.`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 320,
      temperature: 0.65,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Errore Groq API' }, { status: 500 });
  }

  const data = await res.json();
  const text = data.choices[0]?.message?.content ?? '';
  return NextResponse.json({ text });
}
