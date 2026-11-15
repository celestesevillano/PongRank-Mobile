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
  title: 'Sigue tu progreso',
  description: 'Consulta cómo cambia tu rating, tu porcentaje de victorias, tu racha y tu mejor victoria.',
};
const coach: Benefit = {
  Icon: Bot, title: 'Acceso a Coach Pongi', description: 'El análisis de postura y movimiento aún no está disponible en la app.', availability: true,
};
const club = (maximum: number): Benefit => ({
  Icon: Shield, title: 'Crea y administra tu club',
  description: `Puedes tener ${maximum} club${maximum === 1 ? '' : 'es'} en total. El club que administras ocupa un espacio.`,
});

export function planBenefits(plan: MembershipPlan, quotas?: MyPlanResponse): Benefit[] {
  const spaces: Benefit = {
    Icon: Users,
    title: 'Tus espacios',
    description: 'Puedes unirte a comunidades. Cada comunidad en la que participas ocupa un espacio.',
  };
  const created = quotas?.maxCommunitiesCreated ?? 1;
  const clubs = quotas?.maxClubsTotal ?? (plan === 'BASIC' ? 2 : 5);
  const total = quotas?.maxSpaces ?? (plan === 'BASIC' ? 4 : 6);
  const paidSpaces: Benefit = {
    Icon: Users, title: `Participa en hasta ${total} espacios`,
    description: `Puedes crear hasta ${created} ${created === 1 ? 'comunidad' : 'comunidades'} y pertenecer a hasta ${clubs} ${clubs === 1 ? 'club' : 'clubes'} dentro de ese cupo.`,
  };
  switch (plan) {
    case 'FREEMIUM': return [spaces];
    case 'BASIC': return [statistics, paidSpaces];
    case 'PRO': return [statistics, coach, paidSpaces];
    case 'ENTERPRISE':
      return [
        club(quotas?.maxClubsTotal ?? 1),
        { ...paidSpaces, description: `Tu club y las comunidades que crees o a las que te unas cuentan dentro de ese cupo.` },
        statistics,
        coach,
      ];
  }
}
