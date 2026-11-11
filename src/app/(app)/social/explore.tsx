import { router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { CommunityCard } from '@/components/communities/community-card';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePaginated } from '@/hooks/use-paginated';
import { communitiesService } from '@/services/communities.service';

export default function ExploreCommunitiesScreen() {
  const [query, setQuery] = useState('');
  const name = useDebouncedValue(query.trim(), 300);
  const results = usePaginated((params, signal) => communitiesService.search({ ...params, name: name || undefined }, signal), [name]);

  return (
    <CommunityScreen title="Explorar comunidades" onBack={() => router.dismissTo('/social')}>
      <AuthInput icon={Search} accessibilityLabel="Buscar comunidad" placeholder="Buscar comunidad" value={query}
        onChangeText={(value) => { setQuery(value); results.setPage(0); }} />
      <ScreenState loading={results.loading} error={results.error} empty={results.data?.content.length === 0}
        emptyMessage="No encontramos comunidades con ese nombre." onRetry={results.refetch} />
      {!results.loading && !results.error && results.data && (
        <FlatList data={results.data.content} keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: Spacing.two, paddingTop: Spacing.three }}
          renderItem={({ item }) => <CommunityCard community={item} onPress={() => router.push({ pathname: '/social/[id]', params: { id: item.id } })} />}
          ListFooterComponent={results.data.totalPages > 1 ? <PaginationBar page={results.data} onPageChange={results.setPage} /> : null} />
      )}
    </CommunityScreen>
  );
}
