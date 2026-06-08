export const PLANS = {
  free: {
    name: 'Grátis',
    maxStudents: 2,
    features: ['repo', 'history', 'tracking'],
  },
  pro10: {
    name: 'Pro 10',
    maxStudents: 10,
    monthlyPrice: 3990, // centavos
    annualPrice: 2990,
    features: ['repo', 'history', 'tracking', 'media', 'priority_support'],
  },
  pro50: {
    name: 'Pro 50',
    maxStudents: 50,
    monthlyPrice: 5990,
    annualPrice: 4990,
    features: ['repo', 'history', 'tracking', 'media', 'priority_support', 'reports'],
  },
  pro100: {
    name: 'Pro 100',
    maxStudents: 100,
    monthlyPrice: 8990,
    annualPrice: 7990,
    features: ['repo', 'history', 'tracking', 'media', 'priority_support', 'reports', 'multi_professor', 'api'],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  const key = plan as PlanKey;
  return PLANS[key] ?? PLANS.free;
}

export function canAddStudent(plan: string, currentActiveStudents: number): boolean {
  const limits = getPlanLimits(plan);
  return currentActiveStudents < limits.maxStudents;
}
