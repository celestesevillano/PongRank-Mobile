import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight, RotateCw, type LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { Brand } from '@/constants/theme';
import type { PlayerSummary } from '@/types/api';
import type { ApiError } from '@/utils/api-error';

export const pongiArt = {
  banner: require('../../../assets/images/pongi-ranky-pongmigos.webp'),
  inbox: require('../../../assets/images/pongi-pongmigos-buzon.webp'),
  search: require('../../../assets/images/pongi-pongmigos-busqueda.webp'),
  rival: require('../../../assets/images/pongi-pongmigos-rival.webp'),
  cancelled: require('../../../assets/images/pongi-pongmigos-solicitud-cancelada.webp'),
  offline: require('../../../assets/images/pongi-pongmigos-sin-conexion.webp'),
};

export function openPlayer(player: PlayerSummary) {
  router.push({ pathname: '/social/player/[playerId]', params: { playerId: String(player.id) } });
}

export function challengePlayer(player: PlayerSummary) {
  router.push({ pathname: '/new-match', params: { opponentId: String(player.id) } });
}

export function PongmigoButton({ label, icon: Icon, variant = 'primary', busy, disabled, style, ...props }:
  Omit<PressableProps, 'style'> & { label: string; icon?: LucideIcon; variant?: 'primary' | 'secondary' | 'text'; busy?: boolean; style?: PressableProps['style'] }) {
  const off = disabled || busy;
  const color = disabled ? '#9A9CA3' : variant === 'text' ? '#22D3EE' : Brand.text;
  return (
    <Pressable {...props} accessibilityRole="button" accessibilityLabel={label}
      accessibilityState={{ disabled: off, busy }} disabled={off}
      style={(state) => [styles.button, styles[variant], disabled && styles.disabled,
        state.pressed && styles.pressed, typeof style === 'function' ? style(state) : style]}>
      {busy ? <ActivityIndicator size="small" color={color} /> : Icon && <Icon size={17} color={color} />}
      <Text numberOfLines={1} style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function PlayerIdentity({ player, showRating = false }: { player: PlayerSummary; showRating?: boolean }) {
  const initials = player.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <>
      <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
      <View style={styles.identity}>
        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
        {showRating ? <Text style={styles.detail}>{Math.round(player.ratingGlicko)} de rating</Text>
          : player.username ? <Text style={styles.detail} numberOfLines={1}>@{player.username}</Text> : null}
      </View>
    </>
  );
}

export function PlayerResult({ player }: { player: PlayerSummary }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => openPlayer(player)} style={styles.result}>
      <PlayerIdentity player={player} showRating />
      <ArrowRight size={18} color="#22D3EE" />
    </Pressable>
  );
}

export function PongiState({ text, artwork, error, retry }: { text?: string; artwork?: number; error?: ApiError; retry?: () => void }) {
  return (
    <View style={styles.empty}>
      {(error?.isNetwork || artwork) ? <Image source={error?.isNetwork ? pongiArt.offline : artwork}
        contentFit="contain" style={styles.emptyArt} accessibilityElementsHidden importantForAccessibility="no" /> : null}
      <Text style={styles.emptyCopy}>{error?.isNetwork ? 'No pudimos conectar con PongRank' : error?.message ?? text}</Text>
      {retry && <PongmigoButton label="Reintentar" icon={RotateCw} onPress={retry} />}
    </View>
  );
}

export type ResultNotice = { title: string; message: string; icon: LucideIcon; success?: boolean };

export function ResultDialog({ info, onClose }: { info: ResultNotice | null; onClose: () => void }) {
  if (!info) return null;
  const { icon: Icon, title, message, success } = info;
  const color = success ? '#2ECC71' : '#22D3EE';
  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <ScrollView contentContainerStyle={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <View style={[styles.circle, { borderColor: color }]}><Icon size={21} color={color} /></View>
          <Text accessibilityRole="header" style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.emptyCopy}>{message}</Text>
          <PongmigoButton label="Aceptar" onPress={onClose} style={styles.acknowledge} />
        </View>
      </ScrollView>
    </Modal>
  );
}

export const pongmigosStyles = StyleSheet.create({
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 14 },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700' },
  body: { color: '#B9BBC1', fontSize: 14 },
});

const styles = StyleSheet.create({
  button: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, borderRadius: 12 },
  primary: { backgroundColor: '#D81E28' },
  secondary: { borderColor: '#B9BBC1', borderWidth: 1 },
  text: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: '#232326', borderColor: Brand.border },
  pressed: { opacity: 0.8 },
  label: { fontSize: 15, fontWeight: '700' },
  result: { ...pongmigosStyles.card, minHeight: 60, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#153139', borderColor: '#24606C', borderWidth: 1 },
  initials: { color: '#AAEFF7', fontWeight: '800', fontSize: 15 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  name: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  detail: { color: '#B9BBC1', fontSize: 13 },
  empty: { alignItems: 'center', gap: 10, padding: 16 },
  emptyArt: { width: 144, height: 144 },
  emptyCopy: { ...pongmigosStyles.body, textAlign: 'center' },
  backdrop: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000A', padding: 16 },
  dialog: { ...pongmigosStyles.card, width: '100%', maxWidth: 300, alignItems: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 18, gap: 8 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, backgroundColor: '#232326', alignItems: 'center', justifyContent: 'center' },
  dialogTitle: { color: Brand.text, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  acknowledge: { minWidth: 112, marginTop: 4 },
});
