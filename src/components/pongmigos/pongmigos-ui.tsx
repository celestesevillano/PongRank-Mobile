import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ArrowRight, RotateCw, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
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

// Envoltorio de AuthButton: mantiene la API de Pongmigos y usa el botón compartido del sistema de diseño.
export function PongmigoButton({ label, icon, variant = 'primary', busy, disabled, style, ...props }:
  Omit<PressableProps, 'style'> & { label: string; icon?: LucideIcon; variant?: 'primary' | 'secondary' | 'text'; busy?: boolean; style?: PressableProps['style'] }) {
  return <AuthButton {...props} label={label} icon={icon} variant={variant} loading={busy} disabled={disabled} style={style as object} />;
}

export function PlayerIdentity({ player, showRating = false, hideAvatar = false }: { player: PlayerSummary; showRating?: boolean; hideAvatar?: boolean }) {
  const initials = player.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <>
      {hideAvatar ? null : <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>}
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

export function PongiState({ title, text, artwork, error, errorMessage, retry, action, details, contextLabel }: {
  title?: string;
  details?: ReactNode;
  contextLabel?: string;
  text?: string;
  artwork?: number;
  error?: ApiError;
  errorMessage?: string;
  retry?: () => void;
  action?: { label: string; icon: LucideIcon; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      {(error?.isNetwork || artwork) ? <Image source={error?.isNetwork ? pongiArt.offline : artwork}
        contentFit="contain" style={styles.emptyArt} accessibilityElementsHidden importantForAccessibility="no" /> : null}
      {title && <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>}
      {!!contextLabel && <Text style={styles.emptyCopy}>{contextLabel}</Text>}
      {(error || text) && <Text style={styles.emptyCopy}>{error ? errorMessage ?? error.message : text}</Text>}
      {details}
      {retry && <PongmigoButton label="Reintentar" icon={RotateCw} onPress={retry} />}
      {action && <PongmigoButton {...action} />}
    </View>
  );
}

export type ResultNotice = { title: string; message: string; icon: LucideIcon; success?: boolean };

export function ResultDialog({ info, onClose }: { info: ResultNotice | null; onClose: () => void }) {
  return (
    <ConfirmDialog busy={false} onCancel={onClose}
      confirmation={info ? { title: info.title, message: info.message, label: 'Aceptar', Icon: info.icon, success: info.success, infoOnly: true, onConfirm: onClose } : null} />
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
  emptyTitle: { ...pongmigosStyles.heading, textAlign: 'center' },
  emptyCopy: { ...pongmigosStyles.body, textAlign: 'center' },
});
