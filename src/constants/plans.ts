import type { MembershipPlan } from '@/types/api';

export const PLAN_LABEL: Record<MembershipPlan, string> = {
  FREEMIUM: 'Free',
  BASIC: 'Básico',
  PRO: 'Pro',
  ENTERPRISE: 'Enterprise',
};

export type PaidPlan = Exclude<MembershipPlan, 'FREEMIUM'>;

export const PAID_PLANS: { plan: PaidPlan; price: string; description: string; recommended?: boolean }[] = [
  { plan: 'BASIC', price: 'S/ 9.90', description: 'Hasta 5 comunidades y 2 clubes' },
  { plan: 'PRO', price: 'S/ 19.90', description: 'Entrenador virtual, 8 comunidades y 5 clubes', recommended: true },
  { plan: 'ENTERPRISE', price: 'S/ 39.90', description: 'Para organizadores: administra tu club, torneos con llaves, avisos, ranking e insignia' },
];
