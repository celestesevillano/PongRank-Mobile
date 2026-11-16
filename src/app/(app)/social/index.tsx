import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ChevronRight, Layers, Plus, Search, Send } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ClubCard } from '@/components/clubs/club-card';
import { ClubNotice } from '@/components/clubs/club-notice';
import { ActionRow } from '@/components/common/action-row';
import { CommunitiesBanner } from '@/components/communities/communities-banner';
import { CommunityCard } from '@/components/communities/community-card';
import { ScreenState } from '@/components/common/screen-state';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { communitiesService } from '@/services/communities.service';

import { SocialBanner } from '@/components/social/social-banner';
import { PongiState } from '@/components/pongmigos/pongmigos-ui';
import { PongmigosList } from '@/components/pongmigos/pongmigos-list';
import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';

const SEGMENTS = [
  { key: 'communities', label: 'Comunidades' },
  { key: 'clubs', label: 'Clubes' },
  { key: 'friends', label: 'Pongmigos' },
] as const;

type Segment = (typeof SEGMENTS)[number]['key'];

export default function SocialScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const [segment, setSegment] = useState<Segment>(section === 'clubs' ? 'clubs' : 'communities');
  useEffect(() => {
    if (section === 'clubs') {
      setSegment('clubs');
      router.setParams({ section: undefined });
    }
  }, [section]);

  return (
    <ScreenContainer title="Social" titleStyle={styles.socialTitle}>
      <Pressable style={styles.search} accessibilityRole="button" onPress={() => router.push('/social/explore')}>
        <Search size={20} color={Brand.textSecondary} /><Text style={styles.message}>Buscar en Social</Text>
      </Pressable>
      <PillTabs variant="segment" options={SEGMENTS} selected={segment} onSelect={setSegment} />
      {segment === 'communities' && <MyCommunities />}
      {segment === 'clubs' && <MyClubs />}
      {segment === 'friends' && <PongmigosList preview />}
    </ScreenContainer>
  );
}

function MyCommunities() {
  const { plan, openPlans, refresh } = usePlan();
  const [showHistory, setShowHistory] = useState(false);
  const { data, error, loading, refetch } = useFetch((signal) => communitiesService.mine(signal, true));
  useFocusEffect(useCallback(() => {
    refetch();
    void refresh();
  }, [refetch, refresh]));

  const active = data?.filter((community) => !community.status || community.status === 'ACTIVE');
  const deleted = data?.filter((community) => community.status === 'DELETED' || community.status === 'ARCHIVED') ?? [];
  const usedSpaces = plan ? plan.usedSpaces ?? (data ? active?.length : undefined) : undefined;
  const spacesFull = plan?.maxSpaces !== undefined && usedSpaces !== undefined && usedSpaces >= plan.maxSpaces;
  const createBlocked = plan?.maxCommunitiesCreated === 0 || spacesFull;

  const create = () => {
    if (createBlocked) openPlans();
    else router.push('/social/create');
  };

  return (
    <>
      {error && !data ? (
        <View style={styles.listArea}>
          <PongiState error={error} errorMessage={error.isNetwork ? 'No pudimos conectar con PongRank.' : 'No pudimos cargar tus comunidades.'} retry={refetch} />
        </View>
      ) : (
        <FlatList
          data={active ?? []}
          keyExtractor={(item) => String(item.id)}
          style={styles.listArea}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.communitiesHeader}>
              <CommunitiesBanner communityCount={active?.length} used={plan?.usedSpaces} limit={plan?.maxSpaces} />
              <Text accessibilityRole="header" style={styles.heading}>Tu lista</Text>
              {error ? <ScreenState loading={false} error={error} onRetry={refetch} /> : null}
            </View>
          }
          ListEmptyComponent={loading
            ? <ScreenState loading error={null} />
            : !error ? <Text style={styles.emptyCopy}>Aún no perteneces a una comunidad. Encuentra una desde Buscar en Social.</Text> : undefined}
          ListFooterComponent={deleted.length ? (
            <View style={styles.list}>
              {deleted.length > 0 && (
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: showHistory }}
                  onPress={() => setShowHistory((visible) => !visible)} style={styles.historyButton}>
                  <Text style={styles.historyLabel}>Historial de comunidades</Text>
                </Pressable>
              )}
              {showHistory && deleted.map((community) => (
                <CommunityCard key={community.id} community={community}
                  onPress={() => router.push({ pathname: '/social/[id]', params: { id: community.id } })} />
              ))}
            </View>
          ) : undefined}
          renderItem={({ item }) => <CommunityCard community={item}
            onPress={() => router.push({ pathname: '/social/[id]', params: { id: item.id } })} />}
        />
      )}
      <View style={styles.actions}>
        <AuthButton label={createBlocked ? 'Ver planes' : 'Crear comunidad'} icon={createBlocked ? Layers : Plus} onPress={create} />
      </View>
    </>
  );
}

function MyClubs() {
  const { plan, openPlans, refresh } = usePlan();
  const { player } = useSession();
  const { data, loading, error, refetch } = useFetch(async (signal) => {
    const [managed, memberships] = await Promise.all([
      clubsService.managed(signal),
      player ? clubsService.memberships(player.id, signal) : [],
    ]);
    const managedIds = new Set(managed.map(({ id }) => id));
    return {
      managed, joined: memberships.filter(({ clubId, status }) => !managedIds.has(clubId) && status === 'APPROVED'),
    };
  }, [player?.id]);

  useFocusEffect(useCallback(() => {
    refetch();
    void refresh();
  }, [refetch, refresh]));

  const full = plan?.maxSpaces !== undefined && plan.usedSpaces !== undefined && plan.usedSpaces >= plan.maxSpaces;
  const canRegister = !!plan?.canCreateClub && !full && !loading && !error && !data?.managed.some(({ status }) => status !== 'REJECTED' && status !== 'DELETED');
  const openClub = (id: number) => router.push({ pathname: '/social/club', params: { id } });
  const managed = data?.managed ?? [];
  const joined = data?.joined ?? [];

  return (
    <>
      <View style={styles.clubBanner}>
        <SocialBanner kind="clubs" subtitle={plan?.maxSpaces !== undefined && plan.usedSpaces !== undefined
          ? `${plan.usedSpaces} de ${plan.maxSpaces} espacios usados` : undefined} />
      </View>
      <Pressable accessibilityRole="button" style={styles.clubRequests} onPress={() => router.push('/social/club-requests')}>
        <Send size={20} color="#22D3EE" />
        <Text style={styles.heading}>Solicitudes enviadas</Text>
        <ChevronRight size={18} color={Brand.textSecondary} style={styles.clubArrow} />
      </Pressable>
      {loading || error ? (
        <View style={styles.listArea}><ScreenState loading={loading} error={error} onRetry={refetch}
          errorMessage="No pudimos cargar tus clubes." /></View>
      ) : (
        <FlatList data={joined} keyExtractor={(item) => String(item.id)} style={styles.listArea}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<View style={styles.list}>
            <Text accessibilityRole="header" style={styles.heading}>Tu lista</Text>
            {managed.length ? <Text style={styles.message}>Administro</Text> : null}
            {managed.map((club) => <ClubCard key={club.id} name={club.name}
              description={club.status === 'PENDING' ? 'Registro en revisión' : club.status === 'REJECTED' ? 'Información observada' : club.status === 'DELETED' ? 'Club eliminado' : club.status === 'PAUSED' ? 'Club inactivo' : club.address}
              role="admin" onPress={() => openClub(club.id)} />)}
            {joined.length ? <Text style={styles.message}>Soy miembro</Text> : null}
          </View>}
          ListEmptyComponent={managed.length ? undefined : <Text style={styles.emptyCopy}>Aún no tienes clubes.</Text>}
          renderItem={({ item }) => <ClubCard name={item.clubName} description="" role="member" onPress={() => openClub(item.clubId)} />} />
      )}
      <View style={styles.clubActions}>
        {plan && !plan.canCreateClub ? <ClubNotice title="Registro de clubes"
          message={plan.plan === 'ENTERPRISE' ? 'Tu plan permite administrar un club.' : 'Disponible con el plan Enterprise.'} />
          : full ? <ClubNotice title="Sin espacios disponibles" message={`${plan.usedSpaces} de ${plan.maxSpaces} espacios`} /> : null}
        <ActionRow>
          <AuthButton label="Registrar club" icon={Plus} disabled={!canRegister} onPress={() => router.push('/social/register-club')} />
          {!canRegister && <AuthButton label="Ver planes" variant="secondary" onPress={openPlans} />}
        </ActionRow>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  socialTitle: { fontSize: 34 },
  search: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, marginBottom: Spacing.three, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  clubActions: { paddingTop: Spacing.two, paddingBottom: 12, gap: Spacing.two },
  clubRequests: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface, marginBottom: Spacing.two },
  clubArrow: { marginLeft: 'auto' },
  clubBanner: { marginBottom: Spacing.two },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  listArea: { flex: 1 },
  historyButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  historyLabel: { color: '#22D3EE', fontSize: 14, fontWeight: '700' },
  actions: { paddingTop: Spacing.two, paddingBottom: 12 },
  communitiesHeader: { gap: Spacing.three },
  emptyCopy: { color: Brand.textSecondary, fontSize: 14, lineHeight: 20 },
  list: { gap: Spacing.two, paddingBottom: Spacing.two },
  message: { color: Brand.textSecondary, fontSize: 14, textAlign: 'center' },
});
