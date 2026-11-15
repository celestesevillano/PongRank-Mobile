import { router, useFocusEffect } from 'expo-router';
import { Layers, Pencil, Settings } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProfileIdentity } from '@/components/profile/profile-identity';
import { ProfileRow, ProfileScreen } from '@/components/profile/profile-screen';
import { WhatsAppPreference } from '@/components/profile/whatsapp-preference';
import { PLAN_LABEL } from '@/constants/plans';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { matchesService } from '@/services/matches.service';
import { playersService } from '@/services/players.service';
import { EMPTY_PROFILE, toProfilePresentation } from '@/utils/profile-presentation';
import { computeStatistics } from '@/utils/statistics';

export default function PlayerProfileRoute() {
  const { player } = useSession();
  const { plan } = usePlan();
  const [visit, setVisit] = useState(0);
  const playerId = player?.id;
  const history = useFetch((signal) => playerId && visit > 0 ? matchesService.confirmedHistory(playerId, signal) : Promise.resolve(null), [playerId, visit]);
  const presentation = useFetch((signal) => playerId && visit > 0 ? playersService.presentation(playerId, signal) : Promise.resolve(null), [playerId, visit]);

  useFocusEffect(useCallback(() => { setVisit((value) => value + 1); }, []));

  if (!player) return null;
  const stats = history.data ? computeStatistics(history.data, player.id, player.ratingGlicko) : null;
  const currentPlan = plan?.plan === 'FREEMIUM' ? 'Gratis' : plan ? PLAN_LABEL[plan.plan] : undefined;

  return (
    <ProfileScreen
      title="Perfil"
      action={<Pressable accessibilityRole="button" accessibilityLabel="Configuración" style={styles.settings} onPress={() => router.push('/profile/settings')}><Settings size={23} color={Brand.text} /></Pressable>}>
      <ProfileIdentity name={player.name} username={player.username} data={presentation.data ? toProfilePresentation(presentation.data) : EMPTY_PROFILE} />
      <View style={styles.metrics}>
        <ProfileMetric label="Rating PongRank" value={Math.round(player.ratingGlicko)} />
        <ProfileMetric label="Partidas" value={stats?.results.length} />
        <ProfileMetric label="Victorias" value={stats?.wins} />
      </View>
      <ProfileRow Icon={Pencil} label="Editar perfil" onPress={() => router.push('/profile/edit')} />
      <ProfileRow Icon={Layers} label="Mi plan" value={currentPlan} onPress={() => router.push('/profile/plan')} />
      <WhatsAppPreference />
    </ProfileScreen>
  );
}

function ProfileMetric({ label, value }: { label: string; value?: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.number}>{value ?? '—'}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  settings: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  metrics: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, borderColor: '#29424A', backgroundColor: '#131B20', paddingVertical: 12 },
  metric: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.one, gap: 3 },
  number: { color: Brand.cyan, fontSize: 23, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricLabel: { color: Brand.textSecondary, textAlign: 'center', fontSize: 12 },
});
