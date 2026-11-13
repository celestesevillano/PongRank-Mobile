import { Tabs } from 'expo-router';
import { House, Trophy, Swords, Users, CircleUser, type LucideIcon } from 'lucide-react-native';

import { StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, ZoomIn } from 'react-native-reanimated';

import { Brand } from '@/constants/theme';

const tabs = [
  { name: '(home)', title: 'Inicio', Icon: House },
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
          options={{ title, tabBarIcon: ({ focused }) => <TabIcon Icon={Icon} focused={focused} /> }}
        />
      ))}
      <Tabs.Screen name="find-match" options={{ href: null }} />
      <Tabs.Screen name="new-match" options={{ href: null }} />
      <Tabs.Screen name="match/[id]" options={{ href: null }} />
    </Tabs>
  );
}


function TabIcon({ Icon, focused }: { Icon: LucideIcon; focused: boolean }) {
  return (
    <View style={styles.icon}>
      {focused && <Animated.View entering={ZoomIn.withInitialValues({ transform: [{ scale: 0.78 }] }).duration(230).reduceMotion(ReduceMotion.System)} style={styles.active} />}
      <View style={styles.glyph}>
        <Icon color={focused ? Brand.text : Brand.textSecondary} size={focused ? 19 : 23} strokeWidth={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 32, height: 30, alignItems: 'center', justifyContent: 'center' },
  glyph: { zIndex: 1 },
  active: { position: 'absolute', width: 30, height: 30, borderRadius: 15, backgroundColor: Brand.red },
});
