import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';

import { PlansSheet } from '@/components/plans/plans-sheet';
import { membershipsService } from '@/services/memberships.service';
import type { MyPlanResponse } from '@/types/api';

type PlanContextValue = {
  /** null mientras carga o si no se pudo consultar; la app trata ese caso como plan Free. */
  plan: MyPlanResponse | null;
  refresh: () => Promise<void>;
  /** Abre el pop-up de planes (el que se muestra tras tocar un candado o al llegar a un tope). */
  openPlans: () => void;
};

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: PropsWithChildren) {
  const [plan, setPlan] = useState<MyPlanResponse | null>(null);
  const [plansOpen, setPlansOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setPlan(await membershipsService.me());
    } catch {
      // Sin red o sin sesión: se deja el último plan conocido.
    }
  }, []);

  useEffect(() => {
    refresh();
    // Al volver de Mercado Pago el plan pudo cambiar.
    const sub = AppState.addEventListener('change', (state) => state === 'active' && refresh());
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<PlanContextValue>(() => ({ plan, refresh, openPlans: () => setPlansOpen(true) }), [plan, refresh]);

  return (
    <PlanContext.Provider value={value}>
      {children}
      <PlansSheet visible={plansOpen} currentPlan={plan?.plan ?? 'FREEMIUM'} onClose={() => setPlansOpen(false)} />
    </PlanContext.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan debe usarse dentro de PlanProvider');
  return ctx;
}
