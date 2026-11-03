import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthInput } from '@/components/auth/auth-input';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { communitiesService } from '@/services/communities.service';
import type { CommunityResponse } from '@/types/api';
import { useToast } from '@/context/toast';
import { toApiError } from '@/utils/api-error';

export default function OnboardingCommunityScreen() {
  const { completeOnboarding } = useSession();
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [communities, setCommunities] = useState<CommunityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const page = await communitiesService.search({ name: query.trim() || undefined }, controller.signal);
        if (!cancelled) setCommunities(page.content);
      } catch (err) {
        if (!cancelled) setError(toApiError(err).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query]);

  const handleJoin = async (community: CommunityResponse) => {
    setJoiningId(community.id);
    setError(null);
    try {
      await communitiesService.join(community.id);
      setJoinedIds((prev) => new Set(prev).add(community.id));
      showToast(`Te uniste a ${community.name}.`);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setJoiningId(null);
    }
  };

  const finish = () => completeOnboarding();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>{'‹'}</Text>
        </Pressable>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Paso 3 de 3</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFillEmpty} />
            <View style={styles.progressFillEmpty} />
            <View style={[styles.progressFill, { flex: 1 }]} />
          </View>
        </View>

        <Image source={require('@/assets/images/pongrank-paddle.png')} style={styles.icon} contentFit="contain" />

        <Text style={styles.title}>Elige tu comunidad</Text>
        <AuthInput placeholder="Buscar comunidad" value={query} onChangeText={setQuery} autoCapitalize="none" />

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator color={Brand.red} style={{ marginTop: Spacing.four }} />
        ) : (
          <FlatList
            data={communities}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ gap: Spacing.two }}
            ListEmptyComponent={<Text style={styles.empty}>No hay comunidades que coincidan con tu búsqueda.</Text>}
            renderItem={({ item }) => {
              const joined = joinedIds.has(item.id);
              return (
                <View style={styles.communityRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.communityName}>{item.name}</Text>
                    <Text style={styles.communityMeta}>{item.memberCount} miembros</Text>
                  </View>
                  <Pressable
                    style={[styles.joinButton, joined && styles.joinButtonDone]}
                    onPress={() => handleJoin(item)}
                    disabled={joined || joiningId === item.id}
                  >
                    {joiningId === item.id ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.joinButtonLabel}>{joined ? 'Unido ✓' : 'Unirme'}</Text>
                    )}
                  </Pressable>
                </View>
              );
            }}
          />
        )}

        <Pressable onPress={() => router.push('/(auth)/create-community')}>
          <Text style={styles.skip}>+ Crear una nueva comunidad</Text>
        </Pressable>

        <Text style={styles.footerHint}>
          Puedes jugar partidas, retar amigos y aparecer en el ranking general sin unirte a ninguna comunidad.
          Unirte te da además un ranking dentro de tu grupo específico.
        </Text>

        <Pressable onPress={finish}>
          <Text style={styles.skip}>Saltar por ahora</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.background },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, gap: Spacing.three },
  back: { color: Brand.text, fontSize: 28 },
  progressRow: { gap: Spacing.one, marginBottom: Spacing.two },
  progressLabel: { color: Brand.textSecondary, fontSize: 12, textAlign: 'center' },
  progressTrack: { flexDirection: 'row', gap: 4 },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: Brand.red },
  progressFillEmpty: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Brand.border },
  icon: { width: 44, height: 44, alignSelf: 'center' },
  title: { color: Brand.text, fontSize: 26, fontWeight: '700', textAlign: 'center' },
  error: { color: Brand.red, fontSize: 13 },
  empty: { color: Brand.textSecondary, textAlign: 'center', marginTop: Spacing.four },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  communityName: { color: Brand.text, fontSize: 15, fontWeight: '600' },
  communityMeta: { color: Brand.textSecondary, fontSize: 12, marginTop: 2 },
  joinButton: { backgroundColor: Brand.red, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  joinButtonDone: { backgroundColor: Brand.border },
  joinButtonLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  footerHint: { color: Brand.textSecondary, fontSize: 11, textAlign: 'center' },
  skip: { color: Brand.textSecondary, textAlign: 'center', marginBottom: Spacing.three, textDecorationLine: 'underline' },
});
