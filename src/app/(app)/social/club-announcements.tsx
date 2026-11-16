import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Send } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { PaginationBar } from '@/components/common/pagination-bar';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PongiState } from '@/components/pongmigos/pongmigos-ui';
import { Brand, Spacing } from '@/constants/theme';
import { usePlan } from '@/context/plan';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePaginated } from '@/hooks/use-paginated';
import { clubsService } from '@/services/clubs.service';

export default function ClubAnnouncementsScreen() {
  const { id, create } = useLocalSearchParams<{ id: string; create?: string }>();
  const clubId = Number(id);
  const { player } = useSession();
  const { plan } = usePlan();
  const club = useFetch((signal) => clubsService.detail(clubId, signal), [id]);
  const notices = usePaginated((params, signal) => clubsService.announcements(clubId, params, signal), [id], 20);
  const [composing, setComposing] = useState(create === 'yes');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const isAdmin = !!player && club.data?.admin?.id === player.id;
  const canPublish = isAdmin && plan?.plan === 'ENTERPRISE';
  const valid = !!title.trim() && !!body.trim();
  const back = () => {
    if (composing) setComposing(false);
    else if (router.canGoBack()) router.back();
    else router.replace('/social');
  };

  async function publish() {
    if (!valid || saving || !canPublish) return;
    setSaving(true);
    setError(false);
    try {
      await clubsService.publish(clubId, { title: title.trim(), body: body.trim() });
      setTitle('');
      setBody('');
      setComposing(false);
      notices.setPage(0);
      notices.refetch();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <CommunityScreen title={composing ? 'Nuevo aviso' : 'Avisos'} onBack={back}>
      {composing ? (
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          <Text style={styles.heading}>Título</Text>
          <AuthInput accessibilityLabel="Título" value={title} onChangeText={setTitle} maxLength={120} editable={!saving} />
          <Text style={styles.heading}>Mensaje</Text>
          <AuthInput accessibilityLabel="Mensaje" value={body} onChangeText={setBody} multiline style={styles.messageInput} maxLength={1000} editable={!saving} />
          {error && <Text accessibilityRole="alert" style={styles.error}>No pudimos publicar el aviso.</Text>}
          <AuthButton label="Publicar aviso" icon={Send} disabled={!valid} loading={saving} onPress={() => void publish()} />
        </ScrollView>
      ) : (
        <>
          {notices.error?.isNetwork ? <View style={styles.centered}>
            <PongiState error={notices.error} errorMessage="No pudimos conectar con PongRank." retry={notices.refetch} />
          </View> : <ScreenState loading={notices.loading} error={notices.error} onRetry={notices.refetch}
            errorMessage="No pudimos cargar los avisos." />}
          {notices.data && !notices.loading && !notices.error && (
            <FlatList data={notices.data.content} keyExtractor={(item) => String(item.id)}
              contentContainerStyle={[styles.list, notices.data.content.length === 0 && styles.centered]}
              ListEmptyComponent={<PongiState artwork={require('../../../../assets/images/club-vacio-avisos.webp')} text="Aún no hay avisos." />}
              ListFooterComponent={notices.data.totalPages > 1 ? <PaginationBar page={notices.data} onPageChange={notices.setPage} /> : undefined}
              renderItem={({ item, index }) => <View style={[styles.card, index === 0 && notices.page === 0 && styles.latest]}>
                <Text style={styles.heading}>{item.title}</Text>
                <Text style={styles.meta}>{item.authorName}</Text>
                <Text style={styles.body}>{item.body}</Text>
              </View>} />
          )}
          {canPublish && <View style={styles.footer}><AuthButton label="Nuevo aviso" icon={Plus} onPress={() => setComposing(true)} /></View>}
        </>
      )}
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two, paddingVertical: 12 },
  centered: { flexGrow: 1, justifyContent: 'center' },
  card: { backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 14, padding: 12, gap: Spacing.two },
  messageInput: { minHeight: 144, textAlignVertical: 'top' },
  latest: { borderColor: '#2D7782', backgroundColor: '#10252B' },
  heading: { color: Brand.text, fontSize: 16, fontWeight: '700' },
  body: { color: Brand.text, fontSize: 15 },
  meta: { color: Brand.textSecondary, fontSize: 13 },
  error: { color: '#FF8085', fontSize: 14 },
  footer: { paddingBottom: 12 },
});
