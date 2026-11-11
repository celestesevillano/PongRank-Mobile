import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { CommunityCard } from '@/components/communities/community-card';
import { CommunityScreen } from '@/components/communities/community-screen';
import { ScreenState } from '@/components/common/screen-state';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { communitiesService } from '@/services/communities.service';
import { toApiError } from '@/utils/api-error';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const communityId = Number(id);
  const { plan, openPlans } = usePlan();
  const { player } = useSession();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const detail = useFetch((signal) => communitiesService.detail(communityId, signal), [communityId]);
  const ranking = useFetch((signal) => communitiesService.ranking(communityId, { size: 3 }, signal), [communityId]);
  const mine = useFetch((signal) => communitiesService.mine(signal), []);
  const community = detail.data;
  const limit = plan?.maxCommunitiesTotal;
  const full = limit !== undefined && mine.data !== null && mine.data.length >= limit;

  const changeMembership = async (action: 'join' | 'leave') => {
    if (busy || !community || !player) return;
    setBusy(true);
    try {
      if (action === 'join') await communitiesService.join(communityId);
      else await communitiesService.leave(communityId, player.id);
      showToast(action === 'join' ? `Ya eres parte de ${community.name}.` : `Saliste de ${community.name}.`);
      router.dismissTo('/social');
    } catch (err) {
      showToast(toApiError(err).message, 'error');
      detail.refetch();
      mine.refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <CommunityScreen title="Comunidad" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <ScreenState loading={detail.loading} error={detail.error} onRetry={detail.refetch} />
      {!detail.loading && !detail.error && community && (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <CommunityCard community={community} featured />
            {community.creatorName && <Text style={styles.meta}>Creada por {community.creatorName}</Text>}
            {community.description && <Text style={styles.description}>{community.description}</Text>}
            {community.isMember && <Text style={styles.member}>Eres miembro</Text>}
            <Text style={styles.heading}>Top 3 de la comunidad</Text>
            <ScreenState loading={ranking.loading} error={ranking.error} empty={ranking.data?.content.length === 0}
              emptyMessage="Aún no hay jugadores en el ranking." onRetry={ranking.refetch} />
            {!ranking.loading && !ranking.error && ranking.data?.content.map((entry) => (
              <View key={entry.playerId} style={styles.row}>
                <Text style={styles.position}>{entry.position}</Text>
                <Text style={styles.player}>{entry.playerName}</Text>
                <Text style={styles.rating}>{Math.round(entry.ratingGlicko)}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            {community.isMember ? (
              <>
                <AuthButton label="Ver ranking" onPress={() => router.navigate({ pathname: '/ranking', params: { communityId } })} />
                <AuthButton label="Salir de la comunidad" variant="ghost" disabled={busy} onPress={() =>
                  Alert.alert('¿Salir de la comunidad?', `Dejarás de ser miembro de ${community.name}.`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir', style: 'destructive', onPress: () => void changeMembership('leave') },
                  ])} />
              </>
            ) : full ? (
              <>
                <Text style={styles.meta}>Ya usaste tus {limit} cupos de comunidad.</Text>
                <AuthButton label="Ver planes" onPress={openPlans} />
                <AuthButton label="Gestionar mis comunidades" variant="ghost" onPress={() => router.dismissTo('/social')} />
              </>
            ) : (
              <AuthButton label="Unirme a la comunidad" loading={busy} onPress={() => void changeMembership('join')} />
            )}
          </View>
        </>
      )}
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  content: { gap: Spacing.two, paddingBottom: Spacing.three },
  actions: { gap: Spacing.two, paddingVertical: Spacing.two },
  meta: { color: Brand.textSecondary, fontSize: 13 },
  description: { color: Brand.text, fontSize: 16, lineHeight: 23 },
  member: { color: '#2ECC71', fontWeight: '700' },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', marginTop: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderRadius: 12, backgroundColor: Brand.surface },
  position: { color: Brand.text, minWidth: 24, textAlign: 'center', fontWeight: '700' },
  player: { color: Brand.text, flex: 1 },
  rating: { color: '#22D3EE', fontWeight: '700' },
});
