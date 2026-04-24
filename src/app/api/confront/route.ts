import { NextRequest } from 'next/server';
import { MILAN_COURSES } from '@/lib/data';

export async function POST(req: NextRequest) {
  const { courseIds, question, lang } = await req.json();

  if (!process.env.GROQ_API_KEY) {
    return new Response('GROQ_API_KEY not configured', { status: 500 });
  }

  const courses = MILAN_COURSES.filter(c => courseIds.includes(c.id));
  if (courses.length < 2) {
    return new Response('Need at least 2 courses', { status: 400 });
  }

  const courseData = courses.map(c =>
    [
      `Nome: ${c.nome}`,
      `Università: ${c.universita}`,
      `Tipo: ${c.tipo}`,
      `Area: ${c.area ?? 'N/A'}`,
      `Durata: ${c.durata ? c.durata + ' anni' : 'N/A'}`,
      `Lingua: ${c.lingua ?? 'Italiano'}`,
      `Sito ufficiale: ${c.url ?? 'N/A'}`,
    ].join('\n')
  ).join('\n\n---\n\n');

  const it = lang === 'it';

  const systemPrompt = it
    ? `Sei un assistente specializzato nell'orientamento universitario in Italia. Sei diretto, preciso e utile. Rispondi sempre in italiano. Non usare elenchi puntati eccessivi — preferisci paragrafi fluidi. Non superare i 200 parole a risposta.`
    : `You are an assistant specialised in Italian university guidance. Be direct, precise and helpful. Always answer in English. Prefer flowing paragraphs over excessive bullet points. Keep responses under 200 words.`;

  const userPrompt = question
    ? (it
      ? `Dati questi corsi universitari:\n\n${courseData}\n\nRispondi a questa domanda specifica: ${question}`
      : `Given these university courses:\n\n${courseData}\n\nAnswer this specific question: ${question}`)
    : (it
      ? `Analizza e confronta questi corsi universitari:\n\n${courseData}\n\nFornisci un'overview delle differenze principali: approccio didattico, tipo di studente più adatto, sbocchi lavorativi, e qualsiasi altra differenza rilevante. Sii specifico e utile per uno studente che deve scegliere.`
      : `Analyse and compare these university courses:\n\n${courseData}\n\nProvide an overview of the main differences: teaching approach, best-fit student profile, career prospects, and any other relevant differences. Be specific and useful for a student making a choice.`);

  const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: true,
      max_tokens: 400,
      temperature: 0.7,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.text();
    return new Response(`Groq error: ${err}`, { status: 502 });
  }

  return new Response(groqRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
