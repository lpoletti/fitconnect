import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('johndoe123', 10);

  // Create professor user (test account)
  const profUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      name: 'John Doe',
      passwordHash,
      userType: 'professor',
    },
  });

  await prisma.professor.upsert({
    where: { userId: profUser.id },
    update: {},
    create: {
      userId: profUser.id,
      plan: 'free',
      maxStudents: 2,
      specialty: 'Musculação e Condicionamento',
    },
  });

  // Create a test student
  const studentPasswordHash = await bcrypt.hash('aluno123', 10);
  const studentUser = await prisma.user.upsert({
    where: { email: 'aluno@teste.com' },
    update: {},
    create: {
      email: 'aluno@teste.com',
      name: 'Maria Silva',
      passwordHash: studentPasswordHash,
      userType: 'aluno',
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
    },
  });

  // Link student to professor
  const professor = await prisma.professor.findUnique({ where: { userId: profUser.id } });
  const student = await prisma.student.findUnique({ where: { userId: studentUser.id } });

  if (professor && student) {
    await prisma.studentProfessorLink.upsert({
      where: {
        studentId_professorId: {
          studentId: student.id,
          professorId: professor.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        professorId: professor.id,
        status: 'active',
      },
    });

    // Create sample workout template
    const existingTemplate = await prisma.workoutTemplate.findFirst({
      where: { professorId: professor.id, name: 'Treino A - Peito e Tríceps' },
    });
    if (!existingTemplate) {
      await prisma.workoutTemplate.create({
        data: {
          professorId: professor.id,
          name: 'Treino A - Peito e Tríceps',
          category: 'Hipertrofia',
          description: 'Treino focado em peito e tríceps para hipertrofia muscular.',
          exercises: {
            create: [
              { exerciseName: 'Supino Reto com Barra', sets: 4, reps: '10-12', suggestedWeight: '40kg', restTime: '90s', notes: 'Manter os ombros retraídos', order: 0 },
              { exerciseName: 'Supino Inclinado com Halteres', sets: 3, reps: '12', suggestedWeight: '16kg', restTime: '60s', notes: '', order: 1 },
              { exerciseName: 'Crossover', sets: 3, reps: '15', suggestedWeight: '10kg', restTime: '60s', notes: 'Focar na contração', order: 2 },
              { exerciseName: 'Tríceps Corda', sets: 3, reps: '12-15', suggestedWeight: '15kg', restTime: '60s', notes: '', order: 3 },
              { exerciseName: 'Tríceps Francês', sets: 3, reps: '12', suggestedWeight: '8kg', restTime: '60s', notes: 'Manter cotovelos fixos', order: 4 },
            ],
          },
        },
      });
    }

    // Create another template
    const existingTemplate2 = await prisma.workoutTemplate.findFirst({
      where: { professorId: professor.id, name: 'Treino B - Costas e Bíceps' },
    });
    if (!existingTemplate2) {
      await prisma.workoutTemplate.create({
        data: {
          professorId: professor.id,
          name: 'Treino B - Costas e Bíceps',
          category: 'Hipertrofia',
          description: 'Treino focado em costas e bíceps.',
          exercises: {
            create: [
              { exerciseName: 'Puxada Frontal', sets: 4, reps: '10-12', suggestedWeight: '45kg', restTime: '90s', notes: '', order: 0 },
              { exerciseName: 'Remada Curvada', sets: 4, reps: '10', suggestedWeight: '30kg', restTime: '90s', notes: 'Manter lombar neutra', order: 1 },
              { exerciseName: 'Remada Unilateral', sets: 3, reps: '12', suggestedWeight: '18kg', restTime: '60s', notes: '', order: 2 },
              { exerciseName: 'Rosca Direta', sets: 3, reps: '12', suggestedWeight: '10kg', restTime: '60s', notes: '', order: 3 },
              { exerciseName: 'Rosca Martelo', sets: 3, reps: '12', suggestedWeight: '10kg', restTime: '60s', notes: '', order: 4 },
            ],
          },
        },
      });
    }

    // Assign a workout to student
    const existingAssigned = await prisma.assignedWorkout.findFirst({
      where: { studentId: student.id, professorId: professor.id, workoutName: 'Treino A - Peito e Tríceps' },
    });
    if (!existingAssigned) {
      await prisma.assignedWorkout.create({
        data: {
          studentId: student.id,
          professorId: professor.id,
          workoutName: 'Treino A - Peito e Tríceps',
          startDate: new Date(),
          status: 'active',
          exercises: {
            create: [
              { exerciseName: 'Supino Reto com Barra', sets: 4, reps: '10-12', suggestedWeight: '40kg', restTime: '90s', notes: 'Manter os ombros retraídos', order: 0 },
              { exerciseName: 'Supino Inclinado com Halteres', sets: 3, reps: '12', suggestedWeight: '16kg', restTime: '60s', notes: '', order: 1 },
              { exerciseName: 'Crossover', sets: 3, reps: '15', suggestedWeight: '10kg', restTime: '60s', notes: 'Focar na contração', order: 2 },
              { exerciseName: 'Tríceps Corda', sets: 3, reps: '12-15', suggestedWeight: '15kg', restTime: '60s', notes: '', order: 3 },
              { exerciseName: 'Tríceps Francês', sets: 3, reps: '12', suggestedWeight: '8kg', restTime: '60s', notes: 'Manter cotovelos fixos', order: 4 },
            ],
          },
        },
      });
    }
  }

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
