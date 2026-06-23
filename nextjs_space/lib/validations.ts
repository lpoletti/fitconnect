import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
  name: z.string().min(1, 'Nome e obrigatorio').max(100),
  userType: z.enum(['professor', 'aluno'], { errorMap: () => ({ message: 'Tipo de usuario invalido' }) }),
  inviteCode: z.string().optional(),
});

export const onboardingSchema = z.object({
  userType: z.enum(['professor', 'aluno']),
  inviteCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token e obrigatorio'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
});

export const linkProfessorSchema = z.object({
  inviteCode: z.string().min(1, 'Codigo de convite e obrigatorio'),
});

export const createWorkoutSchema = z.object({
  workoutName: z.string().min(1, 'Nome e obrigatorio').max(100),
  exercises: z.array(z.object({
    exerciseName: z.string().min(1),
    sets: z.number().min(1).optional(),
    reps: z.string().optional(),
    suggestedWeight: z.string().optional(),
    restTime: z.string().optional(),
    notes: z.string().optional(),
    hasWarmup: z.boolean().optional(),
    setsConfig: z.array(z.any()).optional(),
    warmupConfig: z.array(z.any()).optional(),
    mediaUrl: z.string().optional(),
    mediaType: z.string().optional(),
    mediaPath: z.string().optional(),
    mediaFiles: z.array(z.any()).optional(),
  })).min(1, 'Pelo menos um exercicio e obrigatorio'),
});

export const assignWorkoutSchema = z.object({
  studentId: z.string().min(1, 'studentId e obrigatorio'),
  workoutName: z.string().optional(),
  startDate: z.string().optional(),
  exercises: z.array(z.any()).optional(),
  workouts: z.array(z.object({
    workoutName: z.string().min(1),
    startDate: z.string().optional(),
    exercises: z.array(z.any()).min(1),
  })).optional(),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Nome e obrigatorio').max(100),
  category: z.string().optional(),
  description: z.string().optional(),
  exercises: z.array(z.any()).optional(),
});

export const evaluationSchema = z.object({
  studentId: z.string().min(1, 'studentId e obrigatorio'),
  name: z.string().min(1, 'Nome e obrigatorio'),
  birthDate: z.string().optional(),
  sex: z.enum(['masculino', 'feminino', 'outro']).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  previousTraining: z.boolean().optional(),
  healthIssues: z.boolean().optional(),
  healthDetails: z.string().optional(),
  medication: z.boolean().optional(),
  medicationDetails: z.string().optional(),
  mainGoal: z.enum(['emagrecer', 'hipertrofiar', 'definir', 'condicionamento', 'saude']).optional(),
  sleepQuality: z.enum(['ruim', 'regular', 'boa']).optional(),
  stressLevel: z.enum(['baixo', 'medio', 'alto']).optional(),
  weight: z.union([z.string(), z.number()]).optional(),
  height: z.union([z.string(), z.number()]).optional(),
  waist: z.union([z.string(), z.number()]).optional(),
  abdomen: z.union([z.string(), z.number()]).optional(),
  hip: z.union([z.string(), z.number()]).optional(),
  rightArm: z.union([z.string(), z.number()]).optional(),
  leftArm: z.union([z.string(), z.number()]).optional(),
  rightThigh: z.union([z.string(), z.number()]).optional(),
  leftThigh: z.union([z.string(), z.number()]).optional(),
  photoFront: z.string().optional(),
  photoBack: z.string().optional(),
  photoSide: z.string().optional(),
  photoFrontUrl: z.string().optional(),
  photoBackUrl: z.string().optional(),
  photoSideUrl: z.string().optional(),
  specificGoal: z.string().optional(),
  trainingDays: z.any().optional(),
  studentNotes: z.string().optional(),
  agreedTerms: z.boolean().refine(v => v === true, 'Termo deve ser aceito'),
  signatureName: z.string().optional(),
});

export const checkoutSchema = z.object({
  planKey: z.enum(['pro10', 'pro50', 'pro100']),
  billing: z.enum(['monthly', 'annual']).optional(),
});

export const uploadSchema = z.object({
  fileName: z.string().min(1, 'fileName e obrigatorio'),
  contentType: z.string().min(1, 'contentType e obrigatorio'),
  fileSize: z.number().min(1, 'fileSize e obrigatorio'),
});

export const inviteStudentSchema = z.object({
  email: z.string().email('Email invalido'),
});

export const importAISchema = z.object({
  text: z.string().min(20, 'Texto muito curto. Cole o treino completo.'),
});
