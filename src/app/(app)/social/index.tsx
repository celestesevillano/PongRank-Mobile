import { router, useFocusEffect } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ClubCard } from '@/components/clubs/club-card';
import { CommunityCard } from '@/components/communities/community-card';
import { ScreenState } from '@/components/common/screen-state';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';

import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';

const SEGMENTS = [
  { key: 'communities', label: 'Comunidades' },
  { key: 'clubs', label: 'Clubes' },
  { key: 'friends', label: 'Amigos' },
] as const;

type Segment = (typeof SEGMENTS)[number]['key'];

export default function SocialScreen() {
  const [segment, setSegment] = useState<Segment>('communities');

  return (
    <ScreenContainer title="Social">
      <Pressable style={styles.search} accessibilityRole="button" onPress={() => router.push('/social/explore')}>
        <Search size={20} color={Brand.textSecondary} /><Text style={styles.message}>Buscar comunidades y clubes</Text>
      </Pressable>
      <PillTabs options={SEGMENTS} selected={segment} onSelect={setSegment} />
      {segment === 'communities' && <MyCommunities />}
      {segment === 'clubs' && <MyClubs />}
      {segment === 'friends' && (
        <View style={styles.placeholder}>
          <Text style={styles.message}>Aquí verás tus amigos y las solicitudes pendientes.</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

function MyCommunities() {
  const { plan, openPlans, refresh } = usePlan();
  const { data, error, loading, refetch } = useFetch((signal) => communitiesService.mine(signal));
  useFocusEffect(useCallback(() => {
    refetch();
    void refresh();
  }, [refetch, refresh]));

  const usedSpaces = plan ? plan.usedSpaces ?? data?.length : undefined;
  const spacesFull = plan?.maxSpaces !== undefined && usedSpaces !== undefined && usedSpaces >= plan.maxSpaces;
  const createBlocked = plan?.maxCommunitiesCreated === 0 || spacesFull;

  return (
    <>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Mis comunidades</Text>
        {plan && data && <Text style={styles.message}>{plan.maxSpaces !== undefined ? `Tus espacios · ${plan.usedSpaces ?? data.length} de ${plan.maxSpaces}` : `${data.length} de ${plan.maxCommunitiesTotal} cupos`}</Text>}
      </View>
      {(loading || error) && <View style={styles.listArea}>
      <ScreenState loading={loading} error={error} empty={data?.length === 0}
        emptyMessage="Usa el buscador para encontrar una comunidad." onRetry={refetch} />
      </View>}
      {!loading && !error && (
        <FlatList data={data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <CommunityCard community={item} featured={index === 0}
            onPress={() => router.push({ pathname: '/social/[id]', params: { id: item.id } })} />}
          ListEmptyComponent={<ScreenState loading={false} error={null} empty emptyMessage="Usa el buscador para encontrar una comunidad." />}
          style={styles.listArea} />
      )}
      <View style={styles.actions}>
        <AuthButton label="Crear comunidad" icon={Plus}
          onPress={() => createBlocked ? openPlans() : router.push('/social/create')} />
      </View>
    </>
  );
}

function MyClubs() {
  const { plan, openPlans, refresh } = usePlan();
  const { player } = useSession();
  const { showToast } = useToast();
  const { data, loading, error, refetch } = useFetch(async (signal) => {
    const [managed, memberships] = await Promise.all([
      clubsService.managed(signal),
      player ? clubsService.memberships(player.id, signal) : [],
    ]);
    const managedIds = new Set(managed.map(({ id }) => id));
    return [
      ...managed.map((club) => ({
        id: club.id,
        name: club.name,
        description: club.status === 'APPROVED' ? 'Administras este club' : club.status === 'PENDING' ? 'Registro en revisión' : 'Registro rechazado',
      })),
      ...memberships.filter(({ clubId }) => !managedIds.has(clubId)).map((membership) => ({
        id: membership.clubId,
        name: membership.clubName,
        description: membership.status === 'APPROVED' ? 'Miembro' : 'Solicitud pendiente',
      })),
    ];
  }, [player?.id]);

  useFocusEffect(useCallback(() => {
    refetch();
    void refresh();
  }, [refetch, refresh]));

  const register = () => {
    if (!plan) {
      showToast('No pudimos consultar tu plan. Intenta de nuevo.', 'error');
      void refresh();
      return;
    }
    const full = plan.maxSpaces !== undefined && plan.usedSpaces !== undefined && plan.usedSpaces >= plan.maxSpaces;
    if (!plan.canCreateClub || full) openPlans();
    else router.push('/social/register-club');
  };

  return (
    <>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Mis clubes</Text>
        {plan?.maxSpaces !== undefined && plan.usedSpaces !== undefined &&
          <Text style={styles.message}>Tus espacios · {plan.usedSpaces} de {plan.maxSpaces}</Text>}
      </View>
      {(loading || error) ? (
        <View style={styles.listArea}><ScreenState loading={loading} error={error} onRetry={refetch} /></View>
      ) : (
        <FlatList data={data ?? []} keyExtractor={(item) => String(item.id)} style={styles.listArea}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<ScreenState loading={false} error={null} empty emptyMessage="Usa el buscador para encontrar un club." />}
          renderItem={({ item }) => <ClubCard name={item.name} description={item.description}
            onPress={() => router.push({ pathname: '/social/club', params: { id: item.id } })} />} />
      )}
      <View style={styles.actions}><AuthButton label="Registrar club" icon={Plus} onPress={register} /></View>
    </>
  );
}

const styles = StyleSheet.create({
  search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, marginBottom: Spacing.three, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginBottom: Spacing.two },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  listArea: { flex: 1 },
  actions: { paddingVertical: Spacing.two },
  list: { gap: Spacing.two, paddingBottom: Spacing.two },
  placeholder: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.border },
  message: { color: Brand.textSecondary, fontSize: 14, textAlign: 'center' },
});
