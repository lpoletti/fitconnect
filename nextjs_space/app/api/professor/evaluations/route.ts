export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

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
    const { studentId, ...data } = body;

    if (!studentId) return NextResponse.json({ error: 'studentId é obrigatório' }, { status: 400 });
    if (!data.name) return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    if (!data.agreedTerms) return NextResponse.json({ error: 'Termo deve ser aceito' }, { status: 400 });
    if (!data.photoFrontUrl || !data.photoBackUrl || !data.photoSideUrl) {
      return NextResponse.json({ error: 'As 3 fotos são obrigatórias' }, { status: 400 });
    }

    const evaluation = await prisma.studentEvaluation.create({
      data: {
        studentId,
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
        weight: data.weight ? parseFloat(data.weight) : null,
        height: data.height ? parseFloat(data.height) : null,
        waist: data.waist ? parseFloat(data.waist) : null,
        abdomen: data.abdomen ? parseFloat(data.abdomen) : null,
        hip: data.hip ? parseFloat(data.hip) : null,
        rightArm: data.rightArm ? parseFloat(data.rightArm) : null,
        leftArm: data.leftArm ? parseFloat(data.leftArm) : null,
        rightThigh: data.rightThigh ? parseFloat(data.rightThigh) : null,
        leftThigh: data.leftThigh ? parseFloat(data.leftThigh) : null,
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
