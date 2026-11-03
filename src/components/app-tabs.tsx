import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { Brand } from '@/constants/theme';

const tabs = [
  { name: 'index', title: 'Inicio', icon: '🏠' },
  { name: 'ranking', title: 'Ranking', icon: '🏆' },
  { name: 'matches', title: 'Partidas', icon: '🏓' },
  { name: 'profile', title: 'Perfil', icon: '👤' },
] as const;

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Brand.red,
        tabBarInactiveTintColor: Brand.textSecondary,
        tabBarStyle: { backgroundColor: Brand.background, borderTopColor: Brand.border },
      }}>
      {tabs.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: ({ focused }) => <Text style={{ opacity: focused ? 1 : 0.6 }}>{icon}</Text> }}
        />
      ))}
      <Tabs.Screen name="find-match" options={{ href: null }} />
      <Tabs.Screen name="new-match" options={{ href: null }} />
    </Tabs>
  );
}
