export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const CRON_SECRET = process.env.CRON_SECRET ?? 'fitconnect-cron-2026';
const AUTO_COMPLETE_HOURS = 12;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token !== CRON_SECRET) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    const cutoff = new Date(Date.now() - AUTO_COMPLETE_HOURS * 60 * 60 * 1000);

    const staleLogs = await prisma.workoutLog.findMany({
      where: {
        status: 'in_progress',
        startedAt: { lte: cutoff },
      },
      include: { exerciseLogs: true },
    });

    if (staleLogs.length === 0) {
      return NextResponse.json({ message: 'Nenhum treino pendente', autoCompleted: 0 });
    }

    let autoCompleted = 0;
    let noData = 0;

    for (const log of staleLogs) {
      const hasExerciseData = log.exerciseLogs.length > 0;

      await prisma.workoutLog.update({
        where: { id: log.id },
        data: {
          status: hasExerciseData ? 'auto_completed' : 'cancelled',
          completedAt: new Date(),
          notes: hasExerciseData
            ? (log.notes ? `${log.notes} [Auto-concluido apos ${AUTO_COMPLETE_HOURS}h]` : `[Auto-concluido apos ${AUTO_COMPLETE_HOURS}h]`)
            : `[Auto-concluido apos ${AUTO_COMPLETE_HOURS}h - sem dados de exercicio]`,
        },
      });

      if (hasExerciseData) {
        autoCompleted++;
      } else {
        noData++;
      }
    }

    return NextResponse.json({
      autoCompleted,
      noData,
      total: staleLogs.length,
      hoursCutoff: AUTO_COMPLETE_HOURS,
    });
  } catch (error: any) {
    console.error('Auto-complete workouts error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
