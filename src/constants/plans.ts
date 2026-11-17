import type { MembershipPlan } from '@/types/api';

export const PLAN_LABEL: Record<MembershipPlan, string> = {
  FREEMIUM: 'Free',
  BASIC: 'Básico',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export type PaidPlan = Exclude<MembershipPlan, 'FREEMIUM'>;

export const PAID_PLANS: { plan: PaidPlan; price: string; description: string; recommended?: boolean }[] = [
  { plan: 'BASIC', price: 'S/ 9.90', description: '4 espacios y estadísticas' },
  { plan: 'PRO', price: 'S/ 19.90', description: '6 espacios, estadísticas y Coach Pongi', recommended: true },
  { plan: 'ENTERPRISE', price: 'S/ 39.90', description: 'Tu club, 6 espacios, estadísticas y Coach Pongi' },
];
