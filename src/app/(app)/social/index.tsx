import { router, useFocusEffect } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { CommunityCard } from '@/components/communities/community-card';
import { ScreenState } from '@/components/common/screen-state';
import { usePlan } from '@/context/plan';
import { useFetch } from '@/hooks/use-fetch';
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

const COMING_SOON: Record<Exclude<Segment, 'communities'>, string> = {
  clubs: 'Aquí verás tus clubes y podrás pedir ingreso a otros.',
  friends: 'Aquí verás tus amigos y las solicitudes pendientes.',
};

export default function SocialScreen() {
  const [segment, setSegment] = useState<Segment>('communities');

  return (
    <ScreenContainer title="Social">
      <PillTabs options={SEGMENTS} selected={segment} onSelect={setSegment} />
      {segment === 'communities' ? <MyCommunities /> : (
        <View style={styles.placeholder}>
          <Text style={styles.message}>{COMING_SOON[segment]}</Text>
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
        emptyMessage="Explora comunidades y encuentra gente con quien jugar." onRetry={refetch} />
      </View>}
      {!loading && !error && (
        <FlatList data={data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <CommunityCard community={item} featured={index === 0}
            onPress={() => router.push({ pathname: '/social/[id]', params: { id: item.id } })} />}
          ListEmptyComponent={<ScreenState loading={false} error={null} empty emptyMessage="Explora comunidades y encuentra gente con quien jugar." />}
          style={styles.listArea} />
      )}
      <View style={styles.actions}>
        <AuthButton label="Explorar comunidades" icon={Search} onPress={() => router.push('/social/explore')} />
        <AuthButton label="Crear comunidad" icon={Plus} variant="ghost"
          onPress={() => createBlocked ? openPlans() : router.push('/social/create')} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginBottom: Spacing.two },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  listArea: { flex: 1 },
  actions: { paddingVertical: Spacing.two },
  list: { gap: Spacing.two, paddingBottom: Spacing.two },
  placeholder: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.border },
  message: { color: Brand.textSecondary, fontSize: 14, textAlign: 'center' },
});
