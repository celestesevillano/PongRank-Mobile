import { Image } from 'expo-image';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { ChartNoAxesColumnIncreasing, ChevronLeft, ChevronRight, Flame, TrendingDown, TrendingUp, Trophy, Zap } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { ScreenState } from '@/components/common/screen-state';
import { RatingChart, signedRating, STAT_CYAN } from '@/components/statistics/rating-chart';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { authService } from '@/services/auth.service';
import { matchesService } from '@/services/matches.service';
import { computeStatistics, filterRating, monthlyResults, streakMessage, type StatisticsPeriod } from '@/utils/statistics';

const paddle = require('../../../../assets/images/pongrank-intro-paddle.png');
const ball = require('../../../../assets/images/pongrank-intro-ball.png');
const amber = '#FFCB68';
const loss = '#FF8990';

export default function StatisticsRoute() {
  const { player } = useSession();
  const { plan } = usePlan();

  if (!player || plan?.plan === 'FREEMIUM') return <Redirect href="/" />;
  if (!plan) return <UnverifiedPlan />;

  return <StatisticsScreen key={player.id} playerId={player.id} sessionRating={player.ratingGlicko} />;
}

function UnverifiedPlan() {
  const { refresh } = usePlan();
  const lookup = useFetch(async () => { await refresh(); return true; }, [refresh]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.back}>
          <ChevronLeft size={22} color="#C2C4CA" />
          <Text style={styles.secondary}>Inicio</Text>
        </Pressable>
        <ScreenState loading={lookup.loading} error={null} />
        {lookup.loading ? null : (
          <>
            <Text style={styles.secondary}>No pudimos verificar tu plan.</Text>
            <Pressable accessibilityRole="button" style={styles.back} onPress={lookup.refetch}>
              <Text style={styles.retry}>Reintentar</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatisticsScreen({ playerId, sessionRating }: { playerId: number; sessionRating: number }) {
  const [period, setPeriod] = useState<StatisticsPeriod>('Mes');
  const { width, fontScale } = useWindowDimensions();
  const stackCards = width < 360 || fontScale > 1.2;
  const [focusVersion, setFocusVersion] = useState(0);
  useFocusEffect(useCallback(() => {
    setFocusVersion((version) => version + 1);
  }, []));

  const history = useFetch(async (signal) => {
    if (focusVersion === 0) return null;
    const matches = await matchesService.confirmedHistory(playerId, signal);
    const player = await authService.me(signal);
    return { stats: computeStatistics(matches, playerId, player.ratingGlicko), rating: player.ratingGlicko, now: Date.now() };
  }, [focusVersion, playerId]);

  const snapshot = history.data;
  const selected = useMemo(() => snapshot && filterRating(snapshot.stats, period, snapshot.now), [period, snapshot]);
  const insight = snapshot && monthlyResults(snapshot.stats, snapshot.now);
  const rating = snapshot?.rating ?? sessionRating;
  const best = snapshot?.stats.best;
  const delta = selected?.delta;
  const DeltaIcon = delta != null && delta < 0 ? TrendingDown : TrendingUp;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={history.loading && !!snapshot} onRefresh={history.refetch} tintColor={STAT_CYAN} colors={[STAT_CYAN]} />}>
        <View style={styles.hero}>
          <View style={styles.heroArt} pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <Svg width="100%" height="100%" viewBox="0 0 180 116">
              <Path d="M5 105 Q73 23 152 53" stroke="#711922" strokeWidth={3} fill="none" />
              <Path d="M25 105 Q93 38 158 56" stroke={Brand.red} strokeOpacity={0.7} strokeWidth={1.5} fill="none" />
              <Path d="M40 107 Q102 51 148 58" stroke="#4B1119" strokeWidth={2} fill="none" />
            </Svg>
            <Image source={paddle} contentFit="contain" style={styles.paddle} />
            <Image source={ball} contentFit="contain" style={styles.ball} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <ChevronLeft size={22} color="#C2C4CA" />
            <Text style={styles.secondary}>Inicio</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.heading}>Estadísticas</Text>
          <Text style={styles.subtitle}>Tu rendimiento en la mesa</Text>
        </View>

        <View style={styles.ratingCard}>
          <Diagonal color={STAT_CYAN} />
          <Text style={styles.ratingLabel}>RATING ACTUAL</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.rating}>{Number.isFinite(rating) ? Math.round(rating) : '—'}</Text>
            {delta != null && !history.error ? (
              <View accessible accessibilityLabel={`Variación en ${period.toLowerCase()}: ${signedRating(delta)} puntos`} style={styles.delta}>
                <DeltaIcon color={delta < 0 ? loss : STAT_CYAN} size={17} />
                <Text style={[styles.deltaText, { color: delta < 0 ? loss : STAT_CYAN }]}>{signedRating(delta)} pts</Text>
              </View>
            ) : null}
          </View>
        </View>

        <ScreenState loading={history.loading && !snapshot} error={history.error} onRetry={history.refetch} />

        {snapshot && selected && !history.error ? (
          <>
            <RatingChart period={period} onPeriodChange={setPeriod} points={selected.points} incomplete={selected.incomplete} />
            <Results wins={snapshot.stats.wins} losses={snapshot.stats.losses} />

            <View style={[styles.highlights, stackCards && styles.stacked]}>
              <View style={[styles.highlight, styles.streakCard]}>
                <Diagonal color={Brand.red} />
                <View style={styles.sectionHeader}>
                  <Flame color={loss} size={19} />
                  <Text accessibilityRole="header" style={styles.highlightTitle}>Racha actual</Text>
                </View>
                <Text style={styles.highlightValue}>{snapshot.stats.streak} {snapshot.stats.streak === 1 ? 'victoria' : 'victorias'}</Text>
                <Text style={styles.secondary}>{snapshot.stats.streak === 1 ? 'consecutiva' : 'consecutivas'}</Text>
                <View style={styles.encouragement}>
                  <Zap size={13} color={amber} />
                  <Text style={styles.encouragementText}>{streakMessage(snapshot.stats.streak)}</Text>
                </View>
              </View>

              {best ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Abre el detalle de la partida"
                  onPress={() => router.push({ pathname: '/match/[id]', params: { id: best.id } })}
                  style={({ pressed }) => [styles.highlight, styles.bestCard, pressed && styles.pressed]}>
                  <Diagonal color={amber} />
                  <BestHeading />
                  <Text style={styles.highlightValue}>{best.opponent.name}</Text>
                  {Number.isFinite(best.opponent.ratingGlicko) ? (
                    <Text style={styles.secondary}>Rating {Math.round(best.opponent.ratingGlicko)}</Text>
                  ) : null}
                  <ChevronRight size={18} color={amber} style={styles.bestArrow} />
                </Pressable>
              ) : (
                <View style={[styles.highlight, styles.bestCard]}>
                  <Diagonal color={amber} />
                  <BestHeading />
                  <Text style={styles.secondary}>Aún sin victorias.</Text>
                </View>
              )}
            </View>

            {insight ? (
              <View style={styles.insight}>
                <Diagonal color={STAT_CYAN} />
                <TrendingUp color={STAT_CYAN} size={22} />
                <View style={styles.insightCopy}>
                  <Text accessibilityRole="header" style={styles.highlightTitle}>Tus últimos 30 días</Text>
                  <Text style={styles.secondary}>
                    {insight.wins === 0
                      ? `Jugaste ${insight.played} partidas sin victorias.`
                      : `Ganaste ${insight.wins} de tus ${insight.played} partidas.`}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Diagonal({ color }: { color: string }) {
  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.diagonal}>
      <View style={[styles.stripe, { backgroundColor: color }]} />
      <View style={[styles.stripe, styles.thinStripe, { backgroundColor: color }]} />
    </View>
  );
}

function BestHeading() {
  return (
    <View style={styles.sectionHeader}>
      <Trophy color={amber} size={19} />
      <Text accessibilityRole="header" style={styles.highlightTitle}>Mejor victoria</Text>
    </View>
  );
}

function Results({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  return (
    <View style={styles.results}>
      <View style={[styles.sectionHeader, styles.resultsHeading]}>
        <ChartNoAxesColumnIncreasing size={21} color={STAT_CYAN} />
        <Text accessibilityRole="header" style={styles.sectionTitle}>Resultados</Text>
        {total > 0 ? <Text style={styles.rate}>{Math.round(100 * wins / total)} % de victorias</Text> : null}
      </View>
      <View style={styles.bar} importantForAccessibility="no-hide-descendants">
        {wins > 0 ? <View style={{ flex: wins, backgroundColor: STAT_CYAN }} /> : null}
        {losses > 0 ? <View style={{ flex: losses, backgroundColor: Brand.red }} /> : null}
      </View>
      <View style={styles.legend}>
        <Text style={[styles.legendText, { color: STAT_CYAN }]}>{wins} {wins === 1 ? 'victoria' : 'victorias'}</Text>
        <Text style={[styles.legendText, { color: loss }]}>{losses} {losses === 1 ? 'derrota' : 'derrotas'}</Text>
        <Text style={styles.legendText}>{total} {total === 1 ? 'partida' : 'partidas'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.four, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  hero: { minHeight: 116, justifyContent: 'flex-end', overflow: 'hidden', paddingBottom: Spacing.one },
  heroArt: { position: 'absolute', right: -8, top: 0, bottom: 0, width: '47%' },
  paddle: { width: 102, height: 112, position: 'absolute', right: -1, top: 4 },
  ball: { width: 39, height: 39, position: 'absolute', right: 81, top: 44 },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  heading: { color: Brand.text, fontSize: 34, fontWeight: '900', fontStyle: 'italic' },
  subtitle: { color: '#C2C4CA', fontSize: 14, fontWeight: '500', marginTop: Spacing.one },
  secondary: { color: '#B8BDC3', fontSize: 14, fontVariant: ['tabular-nums'] },
  retry: { color: STAT_CYAN, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  ratingCard: { backgroundColor: '#071C23', borderRadius: 16, borderWidth: 1, borderColor: '#216E7D', padding: Spacing.three, overflow: 'hidden' },
  ratingLabel: { color: '#B8BDC3', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
  rating: { color: Brand.text, fontWeight: '900', fontSize: 48, fontVariant: ['tabular-nums'] },
  delta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, backgroundColor: '#09191F', borderWidth: 1, borderColor: '#215360', borderRadius: 16, paddingHorizontal: 10, paddingVertical: Spacing.one },
  deltaText: { fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
  diagonal: { ...StyleSheet.absoluteFill, overflow: 'hidden' },
  stripe: { position: 'absolute', right: 26, top: -65, width: 30, height: 260, transform: [{ rotate: '38deg' }], opacity: 0.15 },
  thinStripe: { right: 12, width: 8, opacity: 0.23 },
  results: { padding: Spacing.three, gap: Spacing.two, borderRadius: 16, borderWidth: 1, borderColor: '#344047', backgroundColor: '#101519' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  resultsHeading: { flexWrap: 'wrap' },
  sectionTitle: { color: Brand.text, fontSize: 18, fontWeight: '800', flexGrow: 1 },
  rate: { color: STAT_CYAN, fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'] },
  bar: { height: 10, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', backgroundColor: '#344047', marginVertical: Spacing.one },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.two },
  legendText: { color: '#B8BDC3', fontSize: 13, fontVariant: ['tabular-nums'] },
  highlights: { flexDirection: 'row', gap: Spacing.two },
  stacked: { flexDirection: 'column' },
  highlight: { flex: 1, minWidth: 0, padding: 12, borderWidth: 1, borderRadius: 16, overflow: 'hidden', gap: Spacing.one },
  streakCard: { borderColor: '#703139', backgroundColor: '#231318' },
  bestCard: { borderColor: '#6B532D', backgroundColor: '#161613' },
  highlightTitle: { color: Brand.text, flexShrink: 1, fontWeight: '800', fontSize: 14 },
  highlightValue: { color: Brand.text, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: Spacing.one },
  encouragement: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, alignSelf: 'flex-start', backgroundColor: '#3B2914', borderRadius: 8, padding: Spacing.two, marginTop: Spacing.one },
  encouragementText: { color: amber, fontWeight: '700', fontSize: 12, flexShrink: 1 },
  bestArrow: { marginTop: 'auto', alignSelf: 'flex-end' },
  insight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: '#081A20', borderRadius: 16, borderWidth: 1, borderColor: '#20444D', overflow: 'hidden', padding: Spacing.three },
  insightCopy: { flex: 1, gap: Spacing.one },
});
