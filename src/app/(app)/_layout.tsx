import { Stack } from 'expo-router';

import { Brand } from '@/constants/theme';
import { PlanProvider } from '@/context/plan';

export default function AppLayout() {
  return (
    <PlanProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.background } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </PlanProvider>
  );
}
