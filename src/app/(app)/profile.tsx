import { router } from 'expo-router';
import { Check, ChevronRight, Flame, LogOut, MessageCircle, Plus, Star, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { matchesService } from '@/services/matches.service';
import { playersService } from '@/services/players.service';
import type { MatchResponse } from '@/types/api';
import { toApiError } from '@/utils/api-error';

const CYAN = '#22D3EE';

function computeStats(matches: MatchResponse[], playerId: number) {
  const mine = matches.filter((m) => m.status === 'CONFIRMED');
  const wins = mine.filter((m) => m.winnerId === playerId);
  const recent = [...mine].sort((a, b) => (b.confirmedAt ?? b.createdAt).localeCompare(a.confirmedAt ?? a.createdAt));
  let streak = 0;
  for (const match of recent) {
    if (match.winnerId !== playerId) break;
    streak += 1;
  }
  let best: { name: string; rating: number } | null = null;
  for (const match of wins) {
    const opponent = match.player1.id === playerId ? match.player2 : match.player1;
    if (opponent && (!best || opponent.ratingGlicko > best.rating)) best = { name: opponent.name, rating: opponent.ratingGlicko };
  }
  return {
    played: mine.length,
    wins: wins.length,
    winRate: mine.length === 0 ? 0 : Math.round((wins.length / mine.length) * 100),
    streak,
    best,
  };
}

export default function ProfileScreen() {
  const { player, signOut, updateLocalPlayer } = useSession();
  const { showToast } = useToast();
  const playerId = player?.id ?? 0;
  const [savingContact, setSavingContact] = useState(false);

  const history = useFetch((signal) => matchesService.byPlayer(playerId, { status: 'CONFIRMED', size: 100 }, signal), [playerId]);
  const communities = useFetch((signal) => communitiesService.mine(signal), []);
  const stats = useMemo(() => computeStats(history.data?.content ?? [], playerId), [history.data, playerId]);

  const confirmSignOut = () =>
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => signOut() },
    ]);

  const toggleContact = async (value: boolean) => {
    if (!player) return;
    setSavingContact(true);
    try {
      updateLocalPlayer(await playersService.update(player.id, { shareContact: value }));
    } catch (err) {
      showToast(toApiError(err).message, 'error');
    } finally {
      setSavingContact(false);
    }
  };

  const initials = (player?.name ?? '').slice(0, 2).toUpperCase();

  return (
    <ScreenContainer title="Perfil">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{player?.name}</Text>
          <View style={styles.ratingRow}>
            <Star color={Brand.red} fill={Brand.red} size={14} />
            <Text style={styles.rating}>{Math.round(player?.ratingGlicko ?? 1500)}</Text>
            {player?.federatedDeclared && player.categoryFdptm ? <Text style={styles.chip}>FDPTM {player.categoryFdptm}</Text> : null}
          </View>
        </View>

        <View style={styles.statRow}>
          <Stat icon={<Trophy color={Brand.red} size={20} />} label="Partidas" value={stats.played} />
          <Stat icon={<Check color={Brand.red} size={20} />} label="Victorias" value={stats.wins} />
          <Stat icon={<Flame color={Brand.red} size={20} />} label="Racha" value={stats.streak} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Estadísticas</Text>
          <View style={styles.line}>
            <Text style={styles.label}>Win rate</Text>
            <Text style={[styles.value, { color: CYAN }]}>{stats.winRate}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${stats.winRate}%` }]} />
          </View>
          <View style={styles.line}>
            <Text style={styles.label}>Mejor victoria</Text>
            <Text style={styles.value}>{stats.best ? `${stats.best.name} · ${Math.round(stats.best.rating)}` : 'Aún sin victorias'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comunidades</Text>
          {(communities.data ?? []).map((community) => (
            <View key={community.id} style={styles.line}>
              <Text style={styles.value}>{community.name}</Text>
              <ChevronRight color={Brand.textSecondary} size={16} />
            </View>
          ))}
          {communities.data?.length === 0 && <Text style={styles.label}>Aún no estás en ninguna comunidad.</Text>}
          <Pressable style={styles.join} onPress={() => router.push('/(auth)/onboarding-community')} hitSlop={8}>
            <Plus color={CYAN} size={14} />
            <Text style={styles.joinLabel}>Unirme a otra</Text>
          </Pressable>
        </View>

        <View style={[styles.card, styles.contactCard]}>
          <MessageCircle color={CYAN} size={24} />
          <Text style={styles.contactText}>Compartir contacto para coordinar partidas</Text>
          <Switch
            value={player?.shareContact ?? false}
            onValueChange={toggleContact}
            disabled={savingContact}
            trackColor={{ true: CYAN, false: Brand.border }}
          />
        </View>

        <Pressable style={styles.signOut} onPress={confirmSignOut} hitSlop={8}>
          <LogOut color={Brand.textSecondary} size={16} />
          <Text style={styles.signOutLabel}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.three, paddingBottom: Spacing.six },
  header: { alignItems: 'center', gap: Spacing.one },
  avatar: { width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderColor: Brand.red, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: Brand.text, fontSize: 24, fontWeight: '700' },
  name: { color: Brand.text, fontSize: 22, fontWeight: '800', marginTop: Spacing.one },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  rating: { color: Brand.red, fontSize: 15, fontWeight: '700' },
  chip: { color: Brand.text, fontSize: 13, borderWidth: 1, borderColor: Brand.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: Spacing.one },
  statRow: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: Spacing.two, borderRadius: Spacing.three, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  statValue: { color: Brand.text, fontSize: 24, fontWeight: '700' },
  card: { backgroundColor: Brand.surface, borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two, borderWidth: 1, borderColor: Brand.border },
  cardTitle: { color: Brand.text, fontSize: 15, fontWeight: '700' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  label: { color: Brand.textSecondary, fontSize: 13 },
  value: { color: Brand.text, fontSize: 14, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  track: { height: 5, borderRadius: 3, backgroundColor: Brand.border },
  fill: { height: 5, borderRadius: 3, backgroundColor: CYAN },
  join: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one, minHeight: 32 },
  joinLabel: { color: CYAN, fontSize: 13, fontWeight: '600' },
  contactCard: { flexDirection: 'row', alignItems: 'center', borderColor: '#1C8B9B' },
  contactText: { flex: 1, color: Brand.text, fontSize: 14 },
  signOut: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 36 },
  signOutLabel: { color: Brand.textSecondary, fontSize: 14 },
});
