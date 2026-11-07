import { http } from '@/services/http';
import type { MembershipPlan, MyPlanResponse, PaymentPreference } from '@/types/api';

export const membershipsService = {
  /** Plan vigente del jugador autenticado, con lo que incluye y sus límites. */
  me: (signal?: AbortSignal) => http.get<MyPlanResponse>('/memberships/me', { signal }).then((r) => r.data),

  /** Crea la preferencia de pago en Mercado Pago; devuelve la URL donde se paga. */
  createPreference: (plan: Exclude<MembershipPlan, 'FREEMIUM'>) =>
    http.post<PaymentPreference>('/payments/create-preference', { plan }).then((r) => r.data),
};
