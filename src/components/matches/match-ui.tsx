import { Image, type ImageSource } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useId, type ComponentRef, type ReactNode } from 'react';
import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { captureRef, releaseCapture } from 'react-native-view-shot';

import { Brand, Spacing } from '@/constants/theme';
import type { MatchResponse, SetScore } from '@/types/api';

export const matchArt = {
  banner: require('../../../assets/images/partidas-banner.webp'),
  idle: require('../../../assets/images/partidas-idle.webp'),
  search: require('../../../assets/images/partidas-search.webp'),
  location: require('../../../assets/images/partidas-location.webp'),
  cancelled: require('../../../assets/images/partidas-cancelled.webp'),
  rival: require('../../../assets/images/partidas-rival.webp'),
  confirmed: require('../../../assets/images/partidas-confirmed.webp'),
  tournaments: require('../../../assets/images/partidas-tournament.webp'),
  tournamentBanner: require('../../../assets/images/torneo-copa-banner.webp'),
  tournamentWin: require('../../../assets/images/torneo-copa-victoria.webp'),
  versus: require('../../../assets/images/partidas-versus.webp'),
  sent: require('../../../assets/images/partidas-waiting.webp'),
  review: require('../../../assets/images/partidas-review.webp'),
  send: require('../../../assets/images/partidas-send.webp'),
  win: require('../../../assets/images/partidas-win.webp'),
  loss: require('../../../assets/images/partidas-loss.webp'),
  offline: require('../../../assets/images/pongi-pongmigos-sin-conexion.webp'),
};

export const formatLabels = { BO3: 'Mejor de 3', BO5: 'Mejor de 5', BO7: 'Mejor de 7' } as const;

export function matchPlace(match: MatchResponse) {
  return match.communityName ?? (match.latitude != null && match.longitude != null ? 'Lugar de encuentro' : null);
}

export function MatchBanner({ title, children, prominent = false, tournament = false }: { title: string; children?: ReactNode; prominent?: boolean; tournament?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const glow = `match-banner-glow-${id}`;
  const fade = `match-banner-fade-${id}`;

  return (
    <View style={[styles.banner, prominent && styles.prominentBanner]}>
      {prominent && <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 135" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <RadialGradient id={glow} cx="100%" cy="50%" rx="100%" ry="75%">
            <Stop offset="0" stopColor="#65202C" />
            <Stop offset="0.64" stopColor="#211014" />
            <Stop offset="1" stopColor="#130B0D" />
          </RadialGradient>
        </Defs>
        <Rect width="400" height="135" fill={`url(#${glow})`} />
      </Svg>}
      <Image source={tournament ? matchArt.tournamentBanner : matchArt.banner} style={tournament ? StyleSheet.absoluteFill : prominent ? styles.prominentArt : styles.bannerImage} contentFit="cover" contentPosition="right center" accessible={false} />
      {prominent && <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 400 135" preserveAspectRatio="none" pointerEvents="none">
        <Defs>
          <LinearGradient id={fade} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0.35" stopColor="#130B0D" />
            <Stop offset="0.65" stopColor="#130B0D" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="400" height="135" fill={`url(#${fade})`} />
      </Svg>}
      <View style={[styles.bannerText, prominent && styles.prominentText]}>
        <Text accessibilityRole="header" style={[styles.bannerTitle, prominent && styles.prominentTitle]}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

export function MatchState({ title, message, art, children }: { title: string; message?: string; art?: ImageSource | number; children?: ReactNode }) {
  return (
    <View style={styles.center}>
      {art && <Image source={art} contentFit="contain" style={styles.art} accessible={false} />}
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {!!message && <Text style={styles.message}>{message}</Text>}
      {children}
    </View>
  );
}

export function MatchNotice({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message: string }) {
  return (
    <View style={styles.notice}>
      <Icon size={17} color={Brand.cyan} />
      <View style={styles.noticeContent}><Text style={styles.noticeTitle}>{title}</Text><Text style={styles.noticeCopy}>{message}</Text></View>
    </View>
  );
}

export function MatchMeta({ icon: Icon, text, color = Brand.cyan }: { icon: LucideIcon; text: string; color?: string }) {
  return <View style={styles.meta}><Icon size={15} color={color} /><Text style={styles.metaText}>{text}</Text></View>;
}

export function MatchResult({ title, message, art, score, sets, reverse = false, gold = false }:
  { title: string; message?: string; art: number; score?: string | null; sets: SetScore[]; reverse?: boolean; gold?: boolean }) {
  return <View style={gold ? styles.winning : undefined}>
    <MatchState title={title} message={message} art={art}>
      {score && <Text style={[styles.resultScore, gold && styles.gold]}>{score}</Text>}
      <View style={styles.sets}>{sets.map((set) => <Text key={set.setNumber} style={styles.set}>
        Set {set.setNumber} · {reverse ? set.scorePlayer2 : set.scorePlayer1}–{reverse ? set.scorePlayer1 : set.scorePlayer2}
      </Text>)}</View>
    </MatchState>
  </View>;
}

export async function shareMatch(card: ComponentRef<typeof View> | null, message: string) {
  if (!card || Platform.OS === 'web' || !await Sharing.isAvailableAsync()) {
    await Share.share({ title: 'PongRank', message });
    return;
  }
  const uri = await captureRef(card, { format: 'png' });
  try {
    await Sharing.shareAsync(uri, { dialogTitle: 'Compartir en PongRank', mimeType: 'image/png', UTI: 'public.png' });
  } finally {
    releaseCapture(uri);
  }
}

const styles = StyleSheet.create({
  banner: { overflow: 'hidden', minHeight: 108, backgroundColor: '#291017', borderColor: '#733440', borderWidth: 1, borderRadius: 16, justifyContent: 'center', padding: 14 },
  prominentBanner: { minHeight: 135, marginTop: 8, marginBottom: 8, padding: 16, backgroundColor: '#130B0D', borderColor: '#71313B' },
  prominentArt: { position: 'absolute', right: 0, top: '-24%', height: '148%', aspectRatio: 1.5 },
  prominentText: { width: '72%', gap: 6 },
  prominentTitle: { fontSize: 29, lineHeight: 33 },
  bannerImage: { position: 'absolute', top: 0, bottom: 0, right: 0, width: '52%' },
  bannerText: { width: '69%', gap: 5 },
  bannerTitle: { color: Brand.text, fontSize: 23, fontWeight: '800' },
  center: { alignItems: 'center', gap: Spacing.two, padding: Spacing.three },
  art: { width: 148, height: 148 },
  title: { color: Brand.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  message: { color: Brand.textSecondary, maxWidth: 280, textAlign: 'center', lineHeight: 20 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderColor: '#2B7A89', borderWidth: 1, padding: 12, backgroundColor: '#102931' },
  noticeContent: { flex: 1, gap: 3 },
  noticeTitle: { color: Brand.cyan, fontWeight: '700' },
  noticeCopy: { color: Brand.text, fontSize: 13, lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flexShrink: 1, color: Brand.textSecondary, fontSize: 13 },
  winning: { borderWidth: 1, borderColor: '#9D742F', backgroundColor: '#2D1B17', borderRadius: 18, paddingVertical: 12 },
  resultScore: { color: Brand.red, fontSize: 58, fontWeight: '900', fontVariant: ['tabular-nums'] },
  gold: { color: '#FFD278' },
  sets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  set: { color: '#A9F1F9', paddingVertical: 5, paddingHorizontal: 6, borderColor: '#2C6873', borderWidth: 1, borderRadius: 7 },
});
