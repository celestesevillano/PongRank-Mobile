import { Bot, ChartNoAxesCombined, Shield, Users, type LucideIcon } from 'lucide-react-native';

import type { MembershipPlan, MyPlanResponse } from '@/types/api';

type Benefit = { Icon: LucideIcon; title: string; description: string; availability?: boolean };

const assets = {
  FREEMIUM: require('../../assets/images/pongrank-intro-ball.png'),
  BASIC: require('../../assets/images/pongrank-plan-basic.webp'),
  PRO: require('../../assets/images/pongrank-plan-pro.webp'),
  ENTERPRISE: require('../../assets/images/pongrank-plan-enterprise.webp'),
} as const;

export const PLAN_ART = {
  FREEMIUM: { image: assets.FREEMIUM, accent: '#A3EBF3', background: '#141E24' },
  BASIC: { image: assets.BASIC, accent: '#22D3EE', background: '#0B2229' },
  PRO: { image: assets.PRO, accent: '#FF8796', background: '#28141B' },
  ENTERPRISE: { image: assets.ENTERPRISE, accent: '#FFD278', background: '#2A2016' },
} as const;

const statistics: Benefit = {
  Icon: ChartNoAxesCombined,
  title: 'Estadísticas',
  description: 'Tu rating, porcentaje de victorias, racha y mejor victoria.',
};
const coach: Benefit = {
  Icon: Bot, title: 'Coach Pongi', description: 'Analiza tu postura y movimiento con la cámara.',
};
const club = (maximum: number): Benefit => ({
  Icon: Shield, title: maximum === 1 ? '1 club propio' : `${maximum} clubes propios`,
  description: 'Lo creas y administras tú. Ocupa 1 de tus espacios.',
});

export function planBenefits(plan: MembershipPlan, quotas?: MyPlanResponse): Benefit[] {
  const total = quotas?.maxSpaces ?? (plan === 'FREEMIUM' ? 2 : plan === 'BASIC' ? 4 : 6);
  const spaces: Benefit = {
    Icon: Users, title: `${total} espacios`,
    description: plan === 'ENTERPRISE'
      ? 'Tu club y las comunidades que crees o a las que te unas.'
      : plan === 'FREEMIUM'
        ? 'Únete a comunidades. Cada una usa 1 espacio.'
        : 'Comunidades y clubes. Cada uno usa 1 espacio.',
  };
  switch (plan) {
    case 'FREEMIUM': return [spaces];
    case 'BASIC': return [spaces, statistics];
    case 'PRO': return [spaces, statistics, coach];
    case 'ENTERPRISE': return [club(quotas?.maxClubsTotal ?? 1), spaces, statistics, coach];
  }
}
