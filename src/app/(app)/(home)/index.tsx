import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { ChartNoAxesColumnIncreasing, ChevronRight, ClipboardCheck, Dumbbell, LockKeyhole, Plus, RotateCw, Search, Trophy, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthButton } from '@/components/auth/auth-button';
import { CardLighting } from '@/components/common/card-lighting';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { authService } from '@/services/auth.service';
import { communitiesService } from '@/services/communities.service';
import { matchesService } from '@/services/matches.service';

const cyan = '#22D3EE';
const loss = '#FF8990';
const amber = '#FFCB68';
const ball = require('../../../../assets/images/pongrank-intro-ball.png');

export default function DashboardScreen() {
  const { player } = useSession();
  const { plan, openPlans } = usePlan();
  const [coachNotice, setCoachNotice] = useState(false);
  const [visit, setVisit] = useState(0);
  const playerId = player?.id ?? 0;
  const statisticsLocked = !plan || plan.plan === 'FREEMIUM';

  useFocusEffect(useCallback(() => {
    setVisit((previous) => previous + 1);
  }, []));

  const rating = useFetch((signal) => authService.me(signal), [playerId, visit]);
  const standing = useFetch(async (signal) => {
    const [community] = await communitiesService.mine(signal);
    if (!community) return null;
    const page = await communitiesService.ranking(community.id, { page: 0, size: 100 }, signal);
    return {
      name: community.name,
      position: page.content.find((entry) => entry.playerId === playerId)?.position,
    };
  }, [playerId, visit]);
  const pending = useFetch(async (signal) => {
    const matches = await matchesService.active(playerId, signal);
    return matches.find((match) =>
      (match.status === 'PROPOSED_P1' && match.player2?.id === playerId)
      || (match.status === 'PROPOSED_P2' && match.player1.id === playerId));
  }, [playerId, visit]);
  const recent = useFetch(
    (signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', page: 0, size: 3, sort: ['confirmedAt,desc', 'id,desc'] }, signal),
    [playerId, visit],
  );
  const match = pending.data;
  const recentMatches = recent.data?.content ?? [];
  const opponent = match?.player1.id === playerId ? match?.player2 : match?.player1;
  const currentRating = rating.data?.ratingGlicko ?? player?.ratingGlicko;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <Text accessibilityRole="header" style={styles.heading}>
          Hola, <Text style={styles.accent}>{player?.name?.trim().split(/\s+/)[0] || 'jugador'}</Text>
        </Text>

        <View style={styles.ratingCard}>
          <CardLighting color={cyan} court />
          <Image source={ball} contentFit="contain" style={styles.ball} />
          <View style={styles.ratingRow}>
            <View style={styles.copy}>
              <Text style={styles.label}>RATING ACTUAL</Text>
              <Text style={styles.rating}>{currentRating != null ? Math.round(currentRating) : '—'}</Text>
            </View>
            {standing.data?.position != null ? (
              <View style={styles.position}>
                <Text style={styles.label}>Puesto #{standing.data.position}</Text>
                <Text style={styles.detail} numberOfLines={2}>{standing.data.name}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {match ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/match/[id]', params: { id: match.id } })}
            style={({ pressed }) => [styles.tile, styles.pending, pressed && styles.pressed]}>
            <View style={[styles.icon, styles.pendingIcon]}><ClipboardCheck color={amber} size={20} /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>Revisar resultado</Text>
              <Text style={styles.detail}>{opponent?.name ?? 'Tu rival'} espera tu confirmación</Text>
            </View>
            <ChevronRight color={amber} size={18} />
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          <AuthButton label="Nueva partida" icon={Plus} onPress={() => router.push('/new-match')} />
          <AuthButton label="Buscar partida" icon={Search} variant="ghost" style={styles.search} onPress={() => router.push('/find-match')} />
        </View>

        <View style={styles.shortcuts}>
          <Pressable
            accessibilityRole="button"
            onPress={() => statisticsLocked ? openPlans() : router.push('/statistics')}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={styles.icon}><ChartNoAxesColumnIncreasing color={cyan} size={20} /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>Estadísticas</Text>
              <Text style={styles.detail}>{statisticsLocked ? 'Desde Básico' : 'Tu rating, resultados y racha'}</Text>
            </View>
            {statisticsLocked ? <LockKeyhole color={Brand.textSecondary} size={16} /> : <ChevronRight color={cyan} size={18} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => plan?.coachAccess ? setCoachNotice(true) : openPlans()}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={styles.icon}><Dumbbell color={cyan} size={20} /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>Coach</Text>
              <Text style={styles.detail}>{plan?.coachAccess ? 'Entrenador virtual' : 'Desde Pro'}</Text>
            </View>
            {plan?.coachAccess ? <ChevronRight color={cyan} size={18} /> : <LockKeyhole color={Brand.textSecondary} size={16} />}
          </Pressable>
        </View>

        {recentMatches.length > 0 || recent.error ? (
          <View style={styles.shortcuts}>
            <View style={styles.section}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Tu actividad</Text>
              <Pressable accessibilityRole="button" onPress={() => router.push('/matches')} style={styles.all}>
                <Text style={styles.accent}>Ver partidas</Text><ChevronRight color={cyan} size={16} />
              </Pressable>
            </View>
            <ScreenState loading={false} error={recent.error} onRetry={recent.refetch} retryIcon={RotateCw} />
            {!recent.error ? recentMatches.map((item) => {
              const isPlayer1 = item.player1.id === playerId;
              const rival = isPlayer1 ? item.player2 : item.player1;
              const won = item.winnerId === playerId;
              const delta = isPlayer1 ? item.ratingDeltaP1 : item.ratingDeltaP2;
              const value = delta != null ? Math.round(delta) : null;
              const Icon = won ? Trophy : X;
              const color = won ? cyan : loss;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/match/[id]', params: { id: item.id } })}
                  style={({ pressed }) => [styles.tile, !won && styles.defeat, pressed && styles.pressed]}>
                  <View style={[styles.icon, !won && styles.defeatIcon]}><Icon color={color} size={18} /></View>
                  <View style={styles.copy}>
                    <Text style={[styles.title, { color }]}>{won ? 'Victoria' : 'Derrota'}</Text>
                    <Text style={styles.detail}>{rival?.name ?? 'Rival'}{item.scoreSummary ? ` · ${item.scoreSummary}` : ''}</Text>
                  </View>
                  {value != null ? <Text style={[styles.points, { color: value < 0 ? loss : cyan }]}>{value > 0 ? '+' : ''}{value} pts</Text> : null}
                </Pressable>
              );
            }) : null}
          </View>
        ) : null}
      </ScrollView>
      <ConfirmDialog
        busy={false}
        onCancel={() => setCoachNotice(false)}
        confirmation={coachNotice ? {
          title: 'Coach', message: 'El entrenador virtual aún no está disponible en esta versión de la app.',
          label: 'Entendido', Icon: Dumbbell, onConfirm: () => setCoachNotice(false), cancelLabel: 'Volver',
        } : null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  heading: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  accent: { color: cyan, fontWeight: '700' },
  ratingCard: { backgroundColor: '#071C23', borderRadius: 16, borderWidth: 1, borderColor: '#248997', padding: Spacing.three, overflow: 'hidden' },
  ratingRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: Spacing.two },
  rating: { color: Brand.text, fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'] },
  position: { maxWidth: '48%', padding: Spacing.two, backgroundColor: '#09191F', borderRadius: 8 },
  label: { color: '#C2C4CA', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  ball: { position: 'absolute', width: 58, height: 58, right: 16, bottom: -8, opacity: 0.72 },
  actions: { gap: Spacing.two },
  search: { borderWidth: 1, borderColor: '#248997' },
  shortcuts: { gap: Spacing.two },
  tile: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 14, backgroundColor: '#101519', borderWidth: 1, borderColor: '#344047' },
  icon: { padding: Spacing.two, borderRadius: 8, backgroundColor: '#10333C' },
  pending: { backgroundColor: '#221A10', borderColor: '#74532A' },
  pendingIcon: { backgroundColor: '#422C14' },
  defeat: { backgroundColor: '#241419', borderColor: '#71333C' },
  defeatIcon: { backgroundColor: '#472129' },
  copy: { flex: 1, gap: Spacing.half },
  title: { color: Brand.text, fontSize: 15, fontWeight: '800' },
  detail: { color: '#B8BDC3', fontSize: 13 },
  points: { fontWeight: '800', fontVariant: ['tabular-nums'] },
  pressed: { opacity: 0.75 },
  section: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  sectionTitle: { color: Brand.text, fontSize: 18, fontWeight: '800' },
  all: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
