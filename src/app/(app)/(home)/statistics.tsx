import { Image } from 'expo-image';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { ChartNoAxesColumnIncreasing, ChevronLeft, Flame, RotateCw, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { CardLighting } from '@/components/common/card-lighting';
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
const bestVictoryTrophy = require('../../../../assets/images/pongrank-best-victory.webp');
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
              <RotateCw size={18} color={STAT_CYAN} />
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
  const { width, height, fontScale } = useWindowDimensions();
  const compact = height <= 720 && fontScale <= 1.2;
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
        contentContainerStyle={[styles.content, compact && styles.compactContent]}
        refreshControl={<RefreshControl refreshing={history.loading && !!snapshot} onRefresh={history.refetch} tintColor={STAT_CYAN} colors={[STAT_CYAN]} />}>
        <View style={[styles.hero, compact && styles.compactHero]}>
          <View style={styles.heroArt} pointerEvents="none" importantForAccessibility="no-hide-descendants">
            <Svg width="100%" height="100%" viewBox="0 0 180 116">
              <Defs>
                <RadialGradient id="paddleLight" cx="76%" cy="42%" rx="54%" ry="58%">
                  <Stop offset="0" stopColor="#FF343F" stopOpacity={0.44} />
                  <Stop offset="0.54" stopColor="#E51B36" stopOpacity={0.19} />
                  <Stop offset="1" stopColor="#DC1F31" stopOpacity={0} />
                </RadialGradient>
                <LinearGradient id="ballTrail" x1="0%" y1="100%" x2="100%" y2="0%">
                  <Stop offset="0" stopColor={Brand.red} stopOpacity={0} />
                  <Stop offset="1" stopColor="#FF374A" stopOpacity={0.92} />
                </LinearGradient>
              </Defs>
              <Rect width="180" height="116" fill="url(#paddleLight)" />
              <Path d="M0 110 Q65 43 120 41 Q71 57 0 110Z" fill="url(#ballTrail)" opacity={0.42} />
              <Path d="M0 99 Q65 44 118 39 M18 109 Q66 63 115 48" stroke="url(#ballTrail)" strokeWidth={1.6} fill="none" />
              <Path d="M53 99 L180 79 M45 108 L180 87 M91 93 L90 116 M107 91 L107 116 M122 88 L125 116 M138 86 L143 116 M155 83 L160 116 M170 81 L175 116" stroke="#66838D" strokeOpacity={0.18} strokeWidth={0.8} fill="none" />
            </Svg>
            <Image source={paddle} contentFit="contain" style={[styles.paddle, compact && styles.compactPaddle]} />
            <Image source={ball} contentFit="contain" style={[styles.ball, compact && styles.compactBall]} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.canGoBack() ? router.back() : router.replace('/')}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <ChevronLeft size={22} color="#C2C4CA" />
            <Text style={styles.secondary}>Inicio</Text>
          </Pressable>
          <View style={styles.headingRow}>
            <Text accessibilityRole="header" style={styles.heading}>Estadísticas</Text>
            <Svg width={24} height={28} viewBox="0 0 24 28" style={styles.titleMarks} accessible={false}>
              <Path d="M3 12 L8 2 M9 17 L20 9 M12 23 L23 21" stroke="#FF3145" strokeWidth={3.2} strokeLinecap="round" fill="none" />
            </Svg>
          </View>
          <Text style={styles.subtitle}>Tu rendimiento en la mesa</Text>
        </View>

        <View style={styles.ratingCard}>
          <CardLighting color={STAT_CYAN} court />
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

        <ScreenState loading={history.loading && !snapshot} error={history.error} onRetry={history.refetch} retryIcon={RotateCw} />

        {snapshot && selected && !history.error ? (
          <>
            <RatingChart period={period} onPeriodChange={setPeriod} points={selected.points} incomplete={selected.incomplete} compact={compact} />
            <Results wins={snapshot.stats.wins} losses={snapshot.stats.losses} />

            <View style={[styles.highlights, stackCards && styles.stacked]}>
              <View style={[styles.highlight, styles.streakCard]}>
                <CardLighting color={Brand.red} />
                <View style={styles.sectionHeader}>
                  <Flame color={loss} size={19} />
                  <Text accessibilityRole="header" style={styles.highlightTitle}>Racha actual</Text>
                </View>
                <Text style={styles.highlightValue}>{snapshot.stats.streak} {snapshot.stats.streak === 1 ? 'victoria' : 'victorias'}</Text>
                <Text style={styles.secondary}>{snapshot.stats.streak === 1 ? 'consecutiva' : 'consecutivas'}</Text>
                <View style={styles.encouragement}>
                  <Text style={styles.encouragementText}>{streakMessage(snapshot.stats.streak)}</Text>
                </View>
              </View>

              {best ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityHint="Abre el detalle de la partida"
                  onPress={() => router.push({ pathname: '/match/[id]', params: { id: best.id } })}
                  style={({ pressed }) => [styles.highlight, styles.bestCard, pressed && styles.pressed]}>
                  <CardLighting color={amber} />
                  <Text accessibilityRole="header" style={styles.highlightTitle}>Mejor victoria</Text>
                  <Text style={styles.highlightValue}>{best.opponent.name}</Text>
                  {Number.isFinite(best.opponent.ratingGlicko) ? (
                    <Text style={styles.secondary}>Rating {Math.round(best.opponent.ratingGlicko)}</Text>
                  ) : null}
                  <View style={styles.bestFooter}>
                    <Text style={styles.bestAction}>Ver partida</Text>
                    <Image source={bestVictoryTrophy} contentFit="contain" accessible={false} style={styles.bestTrophy} />
                  </View>
                </Pressable>
              ) : (
                <View style={[styles.highlight, styles.bestCard]}>
                  <CardLighting color={amber} />
                  <Text accessibilityRole="header" style={styles.highlightTitle}>Mejor victoria</Text>
                  <Text style={styles.secondary}>Aún sin victorias.</Text>
                </View>
              )}
            </View>

            {insight ? (
              <View style={styles.insight}>
                <CardLighting color={STAT_CYAN} court />
                <View style={styles.insightIcon}><TrendingUp color={STAT_CYAN} size={22} /></View>
                <Image source={ball} contentFit="contain" style={styles.insightBall} />
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
  compactContent: { gap: Spacing.two },
  compactHero: { minHeight: 100 },
  compactPaddle: { width: 96, height: 102 },
  compactBall: { right: 80, top: 37 },
  hero: { minHeight: 116, justifyContent: 'flex-end', overflow: 'hidden', paddingBottom: Spacing.one },
  heroArt: { position: 'absolute', right: -8, top: 0, bottom: 0, width: '51%' },
  paddle: { width: 116, height: 122, position: 'absolute', right: -1, top: 4 },
  ball: { width: 39, height: 39, position: 'absolute', right: 94, top: 44 },
  back: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start' },
  titleMarks: { marginTop: -5, marginLeft: 2 },
  heading: { flexShrink: 1, color: Brand.text, fontSize: 34, fontWeight: '900', fontStyle: 'italic' },
  subtitle: { color: '#C2C4CA', fontSize: 14, fontWeight: '500', marginTop: Spacing.one },
  secondary: { color: '#B8BDC3', fontSize: 14, fontVariant: ['tabular-nums'] },
  retry: { color: STAT_CYAN, fontWeight: '700' },
  pressed: { opacity: 0.75 },
  ratingCard: { backgroundColor: '#071C23', borderRadius: 16, borderWidth: 1, borderColor: '#248997', padding: Spacing.three, overflow: 'hidden' },
  ratingLabel: { color: '#B8BDC3', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  ratingRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.three },
  rating: { color: Brand.text, fontWeight: '900', fontSize: 48, fontVariant: ['tabular-nums'] },
  delta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, backgroundColor: '#09191F', borderWidth: 1, borderColor: '#215360', borderRadius: 16, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  deltaText: { fontWeight: '800', fontSize: 15, fontVariant: ['tabular-nums'] },
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
  highlight: { flex: 1, minWidth: 0, padding: Spacing.three, borderWidth: 1, borderRadius: 16, overflow: 'hidden', gap: Spacing.one },
  streakCard: { borderColor: '#A03543', backgroundColor: '#231318' },
  bestCard: { borderColor: '#927035', backgroundColor: '#161613' },
  highlightTitle: { color: Brand.text, flexShrink: 1, fontWeight: '800', fontSize: 14 },
  highlightValue: { color: Brand.text, fontSize: 22, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: Spacing.one },
  encouragement: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, alignSelf: 'flex-start', backgroundColor: '#3B2914', borderRadius: 8, padding: Spacing.two, marginTop: Spacing.one },
  encouragementText: { color: amber, fontWeight: '700', fontSize: 12, flexShrink: 1 },
  bestFooter: { marginTop: 'auto', minHeight: 64, paddingRight: 64, justifyContent: 'flex-end' },
  bestAction: { color: amber, fontSize: 12, fontWeight: '700' },
  bestTrophy: { position: 'absolute', right: -8, bottom: -8, width: 72, height: 72 },
  insight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: '#081A20', borderRadius: 16, borderWidth: 1, borderColor: '#24616A', overflow: 'hidden', padding: Spacing.three },
  insightIcon: { backgroundColor: '#10333C', borderRadius: 10, padding: Spacing.two },
  insightBall: { position: 'absolute', right: 6, bottom: 10, width: 40, height: 40, opacity: 0.78 },
  insightCopy: { flex: 1, gap: Spacing.one, paddingRight: 28 },
});
