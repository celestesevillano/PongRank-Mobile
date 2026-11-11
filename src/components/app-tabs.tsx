import { Tabs } from 'expo-router';
import { House, Trophy, Swords, Users, CircleUser } from 'lucide-react-native';

import { Brand } from '@/constants/theme';

const tabs = [
  { name: 'index', title: 'Inicio', Icon: House },
  { name: 'social', title: 'Social', Icon: Users },
  { name: 'matches', title: 'Partidas', Icon: Swords },
  { name: 'ranking', title: 'Ranking', Icon: Trophy },
  { name: 'profile', title: 'Perfil', Icon: CircleUser },
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
      {tabs.map(({ name, title, Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{ title, tabBarIcon: ({ color, focused }) => <Icon color={color} size={24} strokeWidth={focused ? 2.4 : 1.8} /> }}
        />
      ))}
      <Tabs.Screen name="find-match" options={{ href: null }} />
      <Tabs.Screen name="new-match" options={{ href: null }} />
      <Tabs.Screen name="match/[id]" options={{ href: null }} />
    </Tabs>
  );
}
