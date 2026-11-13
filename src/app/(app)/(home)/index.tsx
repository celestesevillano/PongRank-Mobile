import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { Bot, ChartNoAxesColumnIncreasing, ChevronRight, LockKeyhole, Plus, RotateCw, Search, Trophy, X, type LucideIcon } from 'lucide-react-native';
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
const statisticsArt = require('../../../../assets/images/pongrank-home-statistics.webp');
const coachArt = require('../../../../assets/images/pongrank-home-coach.webp');
const wordmark = require('../../../../assets/images/pongrank-wordmark.png');
const ball = require('../../../../assets/images/pongrank-intro-ball.png');

export default function DashboardScreen() {
  const { player } = useSession();
  const { plan, openPlans } = usePlan();
  const [coachNotice, setCoachNotice] = useState(false);
  const [visit, setVisit] = useState(0);
  const playerId = player?.id ?? 0;
  const coachUnlocked = plan?.coachAccess === true;
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
  const recent = useFetch(
    (signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', page: 0, size: 3, sort: ['confirmedAt,desc', 'id,desc'] }, signal),
    [playerId, visit],
  );
  const recentMatches = recent.data?.content ?? [];
  const currentRating = rating.data?.ratingGlicko ?? player?.ratingGlicko;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
        <View style={styles.header}>
          <Image source={wordmark} contentFit="contain" style={styles.wordmark} accessibilityLabel="PongRank" />
          <Text accessibilityRole="header" style={styles.heading}>
            Hola, <Text style={styles.greetingName}>{player?.name?.trim().split(/\s+/)[0] || 'jugador'}</Text>
          </Text>
        </View>

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

        <View style={styles.actionRow}>
          <AuthButton label="Nueva partida" icon={Plus} style={styles.playButton} onPress={() => router.push('/new-match')} />
          <AuthButton label="Buscar partida" icon={Search} variant="ghost" foregroundColor={cyan} style={[styles.playButton, styles.search]} onPress={() => router.push('/find-match')} />
        </View>

        <View style={styles.shortcutRow}>
          <ShortcutBanner
            title="Estadísticas"
            subtitle={statisticsLocked ? 'Requiere Básico' : 'Tu progreso'}
            locked={statisticsLocked}
            Icon={ChartNoAxesColumnIncreasing}
            artwork={statisticsArt}
            onPress={() => statisticsLocked ? openPlans() : router.push('/statistics')}
          />
          <ShortcutBanner
            title="Coach"
            subtitle={coachUnlocked ? 'Postura y movimiento' : 'Requiere Pro'}
            locked={!coachUnlocked}
            Icon={Bot}
            artwork={coachArt}
            coach
            onPress={() => coachUnlocked ? setCoachNotice(true) : openPlans()}
          />
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
          title: 'Coach', message: 'Coach usa MediaPipe para analizar tu postura y movimiento. El análisis aún no está disponible en esta versión.',
          label: 'Entendido', Icon: Bot, onConfirm: () => setCoachNotice(false), cancelLabel: 'Volver',
        } : null}
      />
    </SafeAreaView>
  );
}

function ShortcutBanner({ title, subtitle, locked, Icon, artwork, coach = false, onPress }: {
  title: string;
  subtitle: string;
  locked: boolean;
  Icon: LucideIcon;
  artwork: number;
  coach?: boolean;
  onPress: () => void;
}) {
  const accent = coach ? loss : cyan;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.banner, coach && styles.coachBanner, pressed && styles.pressed]}>
      <CardLighting color={coach ? Brand.red : cyan} />
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.bannerArtwork}>
        <Image source={artwork} contentFit="contain" style={styles.bannerImage} />
      </View>
      <View style={styles.bannerTop}>
        <View style={[styles.icon, coach && styles.defeatIcon]}><Icon color={accent} size={20} /></View>
        {!locked ? <ChevronRight color={accent} size={16} /> : null}
      </View>
      <View style={styles.bannerCopy}>
        <Text style={styles.title}>{title}</Text>
        {locked ? (
          <View style={[styles.lockBadge, coach && styles.coachLockBadge]}>
            <LockKeyhole color={accent} size={14} />
            <Text style={[styles.lockBadgeLabel, { color: coach ? '#FFBCC0' : '#A5F3FC' }]}>{subtitle}</Text>
          </View>
        ) : (
          <Text style={styles.detail}>{subtitle}</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
  header: { gap: Spacing.two, alignItems: 'flex-start' },
  wordmark: { width: 116, height: 20 },
  heading: { color: Brand.text, fontSize: 34, fontWeight: '800' },
  greetingName: { color: cyan },
  accent: { color: cyan, fontWeight: '700' },
  ratingCard: { backgroundColor: '#071C23', borderRadius: 16, borderWidth: 1, borderColor: '#248997', padding: Spacing.three, overflow: 'hidden' },
  ratingRow: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: Spacing.two },
  rating: { color: Brand.text, fontSize: 48, fontWeight: '900', fontVariant: ['tabular-nums'] },
  position: { maxWidth: '48%', padding: Spacing.two },
  label: { color: '#C2C4CA', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  ball: { position: 'absolute', width: 58, height: 58, right: 16, bottom: -8, opacity: 0.72 },
  actionRow: { flexDirection: 'row', gap: Spacing.two },
  playButton: { flex: 1, minWidth: 0, minHeight: 48, paddingVertical: Spacing.two, borderWidth: 1, borderColor: 'transparent' },
  shortcutRow: { flexDirection: 'row', gap: Spacing.two },
  banner: { flex: 1, minWidth: 0, minHeight: 104, borderRadius: 16, borderWidth: 1, borderColor: '#24616A', backgroundColor: '#081A20', padding: Spacing.three, gap: Spacing.two, overflow: 'hidden' },
  coachBanner: { borderColor: '#71333C', backgroundColor: '#241419' },
  bannerTop: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  bannerCopy: { gap: Spacing.half },
  lockBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    paddingHorizontal: Spacing.two, paddingVertical: Spacing.one,
    borderRadius: 8, borderWidth: 1, borderColor: '#24616A', backgroundColor: '#081A20',
  },
  coachLockBadge: { borderColor: '#71333C', backgroundColor: '#29151B' },
  lockBadgeLabel: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  bannerArtwork: { position: 'absolute', right: -4, top: 2, opacity: 0.84 },
  bannerImage: { width: 104, height: 104 },
  search: { borderColor: '#248997' },
  shortcuts: { gap: Spacing.two },
  tile: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 14, backgroundColor: '#101519', borderWidth: 1, borderColor: '#344047' },
  icon: { padding: Spacing.two, borderRadius: 8, backgroundColor: '#10333C' },
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
