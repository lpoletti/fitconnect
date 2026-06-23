export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { evaluationSchema } from '@/lib/validations';
import { validateBody } from '@/lib/api-utils';

// GET: list evaluations for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const studentId = request.nextUrl.searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ error: 'studentId é obrigatório' }, { status: 400 });

    const evaluations = await prisma.studentEvaluation.findMany({
      where: { studentId, professorId: session.user.professorId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(evaluations);
  } catch (error: any) {
    console.error('List evaluations error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST: create new evaluation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.professorId) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

    const body = await request.json();
    const result = validateBody(evaluationSchema, body);
    if ('error' in result) return result.error;
    const data = result.data;

    const evaluation = await prisma.studentEvaluation.create({
      data: {
        studentId: data.studentId,
        professorId: session.user.professorId,
        name: data.name,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        sex: data.sex ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        previousTraining: data.previousTraining ?? false,
        healthIssues: data.healthIssues ?? false,
        healthDetails: data.healthDetails ?? null,
        medication: data.medication ?? false,
        medicationDetails: data.medicationDetails ?? null,
        mainGoal: data.mainGoal ?? null,
        sleepQuality: data.sleepQuality ?? null,
        stressLevel: data.stressLevel ?? null,
        weight: data.weight ? Number(data.weight) : null,
        height: data.height ? Number(data.height) : null,
        waist: data.waist ? Number(data.waist) : null,
        abdomen: data.abdomen ? Number(data.abdomen) : null,
        hip: data.hip ? Number(data.hip) : null,
        rightArm: data.rightArm ? Number(data.rightArm) : null,
        leftArm: data.leftArm ? Number(data.leftArm) : null,
        rightThigh: data.rightThigh ? Number(data.rightThigh) : null,
        leftThigh: data.leftThigh ? Number(data.leftThigh) : null,
        photoFront: data.photoFront ?? null,
        photoBack: data.photoBack ?? null,
        photoSide: data.photoSide ?? null,
        photoFrontUrl: data.photoFrontUrl ?? null,
        photoBackUrl: data.photoBackUrl ?? null,
        photoSideUrl: data.photoSideUrl ?? null,
        specificGoal: data.specificGoal ?? null,
        trainingDays: data.trainingDays ?? null,
        studentNotes: data.studentNotes ?? null,
        agreedTerms: data.agreedTerms ?? false,
        signatureName: data.signatureName ?? null,
      },
    });

    return NextResponse.json(evaluation, { status: 201 });
  } catch (error: any) {
    console.error('Create evaluation error:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
