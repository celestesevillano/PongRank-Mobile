import { router, useFocusEffect } from 'expo-router';
import { useState } from 'react';
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
  const { plan } = usePlan();
  const { data, error, loading, refetch } = useFetch((signal) => communitiesService.mine(signal));
  useFocusEffect(refetch);

  return (
    <>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Mis comunidades</Text>
        {plan && data && <Text style={styles.message}>{data.length} de {plan.maxCommunitiesTotal} cupos</Text>}
      </View>
      <ScreenState loading={loading} error={error} empty={data?.length === 0}
        emptyMessage="Explora comunidades y encuentra gente con quien jugar." onRetry={refetch} />
      {!loading && !error && (
        <FlatList data={data ?? []} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <CommunityCard community={item} featured={index === 0}
            onPress={() => router.push({ pathname: '/social/[id]', params: { id: item.id } })} />}
          ListFooterComponent={<View style={styles.list}>
            <AuthButton label="Explorar comunidades" onPress={() => router.push('/social/explore')} />
            <AuthButton label="Crear comunidad" variant="ghost" onPress={() => router.push('/social/create')} />
          </View>} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginBottom: Spacing.two },
  heading: { color: Brand.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  list: { gap: Spacing.two, paddingBottom: Spacing.two },
  placeholder: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.border },
  message: { color: Brand.textSecondary, fontSize: 14, textAlign: 'center' },
});
