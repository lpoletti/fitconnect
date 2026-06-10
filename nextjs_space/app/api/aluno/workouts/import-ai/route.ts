export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const SYSTEM_PROMPT = `Você é um assistente especializado em extrair e estruturar dados de treinos de musculação a partir de texto livre.

Dado um texto descrevendo treinos, extraia TODOS os treinos organizados por dia. Para cada treino, extraia todos os exercícios com suas séries de aquecimento e séries válidas (de trabalho).

RETORNE JSON no seguinte formato:
{
  "workouts": [
    {
      "name": "Nome do treino (ex: Dia 1 - Posterior e Glúteos)",
      "category": "Grupo muscular principal",
      "description": "Descrição curta se houver",
      "exercises": [
        {
          "exerciseName": "Nome do exercício",
          "notes": "Observações (isometria, fase concêntrica, técnica, RIR por série, etc)",
          "hasWarmup": true,
          "warmupConfig": [
            {
              "reps": "12",
              "weight": "30",
              "weightUnit": "percent",
              "restTime": "45s"
            }
          ],
          "setsConfig": [
            {
              "reps": "12",
              "weight": "",
              "restTime": "120s"
            }
          ]
        }
      ]
    }
  ],
  "generalNotes": "Observações gerais do treino (hidratação, creatina, sono, etc)"
}

REGRAS IMPORTANTES:
- Cada dia de treino = 1 objeto workout separado
- Se um dia diz "repete" outro dia, crie uma cópia com nome indicando que é repetição
- Séries de aquecimento vão em warmupConfig com carga em % (weightUnit: "percent") ou kg (weightUnit: "kg")
- Séries válidas/de trabalho vão em setsConfig
- Se as séries válidas têm RIR (repetições na reserva) diferentes por série ou indicação de "falha", descreva isso no campo notes
- Carga das séries válidas: se o texto diz "100% da carga" deixe weight vazio (será preenchido pelo aluno). Se especifica kg, coloque o valor
- Converta intervalos para formato padronizado: "45s", "60s", "120s", "180s" etc
- Exercícios de cardio (caminhada, corrida, bike, escada) devem ser incluídos como exercício normal com notes descrevendo duração e intensidade
- Bisets/supersets: coloque como um exercício com nome composto (ex: "Remada aberta + Voador invertido com halter") e detalhe no notes
- Se não há aquecimento, hasWarmup = false e warmupConfig = []
- Mantenha a ordem original dos exercícios
- Dias de folga (off) NÃO devem gerar workout

Responda APENAS com JSON válido, sem markdown, sem code blocks.`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.studentId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { text } = body ?? {};

    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ error: 'Texto muito curto. Cole o treino completo.' }, { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Serviço de IA não configurado.' }, { status: 500 });
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Extraia os treinos do seguinte texto:\n\n${text.trim()}` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('LLM API error:', errText);
      return NextResponse.json({ error: 'Erro ao processar com IA. Tente novamente.' }, { status: 502 });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'IA não retornou resultado. Tente novamente.' }, { status: 502 });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse LLM response:', content);
      return NextResponse.json({ error: 'Resposta da IA em formato inválido. Tente novamente.' }, { status: 502 });
    }

    if (!parsed?.workouts || !Array.isArray(parsed.workouts) || parsed.workouts.length === 0) {
      return NextResponse.json({ error: 'Nenhum treino encontrado no texto. Verifique o conteúdo.' }, { status: 400 });
    }

    return NextResponse.json({
      workouts: parsed.workouts,
      generalNotes: parsed.generalNotes ?? '',
    });
  } catch (error: any) {
    console.error('Import AI error:', error);
    return NextResponse.json({ error: 'Erro interno ao processar.' }, { status: 500 });
  }
}
