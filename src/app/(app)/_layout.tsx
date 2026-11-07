import AppTabs from '@/components/app-tabs';
import { PlanProvider } from '@/context/plan';

export default function AppLayout() {
  return (
    <PlanProvider>
      <AppTabs />
    </PlanProvider>
  );
}
