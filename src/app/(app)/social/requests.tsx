import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ArrowRight, Check, Clock, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';

import { ActionRow } from '@/components/common/action-row';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PlayerIdentity, PongmigoButton, PongiState, ResultDialog, openPlayer, pongiArt, pongmigosStyles } from '@/components/pongmigos/pongmigos-ui';
import { Brand } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePongmigoAction } from '@/hooks/use-pongmigo-action';
import { friendOf, friendshipsService } from '@/services/friendships.service';

export default function RequestsScreen() {
  const { box } = useLocalSearchParams<{ box?: string }>();
  const sent = box === 'sent';
  const { player } = useSession();
  const id = player?.id;
  const { data, error, loading, refetch } = useFetch((signal) =>
    id ? (sent ? friendshipsService.sent(id, signal) : friendshipsService.received(id, signal)) : Promise.resolve([]), [id, sent]);
  const { pending, notice, perform, closeNotice } = usePongmigoAction(refetch);
  const [activeId, setActiveId] = useState<number | null>(null);

  useFocusEffect(useCallback(() => { refetch(); }, [refetch]));
  if (!id) return null;

  return (
    <CommunityScreen title={sent ? 'Solicitudes enviadas' : 'Solicitudes recibidas'} onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.centered}>{loading ? <ActivityIndicator color={Brand.red} />
          : error ? <PongiState error={error} retry={refetch} />
          : <PongiState artwork={sent ? pongiArt.cancelled : pongiArt.inbox} text={sent ? 'No tienes solicitudes enviadas.' : 'No tienes solicitudes pendientes.'} />}</View>}
        ListFooterComponent={error && data?.length ? <PongiState error={error} retry={refetch} /> : undefined}
        renderItem={({ item }) => {
          const other = friendOf(item, id);
          const blocked = loading || error !== null;
          const busy = (action: typeof pending) => pending === action && activeId === item.id;
          const act = (action: 'accept' | 'reject' | 'cancel') => {
            setActiveId(item.id);
            void perform(action, item.id);
          };
          return (
            <View style={styles.request}>
              <View style={styles.top}>
                <PlayerIdentity player={other} showRating />
                <PongmigoButton label="Ver perfil" icon={ArrowRight} variant="text" onPress={() => openPlayer(other)} />
              </View>
              {sent ? <>
                <View style={styles.badge}><Clock size={13} color="#B9BBC1" /><Text style={styles.badgeText}>Pendiente</Text></View>
                <PongmigoButton label="Cancelar solicitud" icon={X} busy={busy('cancel')} disabled={blocked || (pending !== null && !busy('cancel'))} onPress={() => act('cancel')} />
              </> : (
                <ActionRow>
                  <PongmigoButton label="Aceptar" icon={Check} busy={busy('accept')} disabled={blocked || (pending !== null && !busy('accept'))} onPress={() => act('accept')} />
                  <PongmigoButton label="Rechazar" icon={X} variant="secondary" busy={busy('reject')} disabled={blocked || (pending !== null && !busy('reject'))} onPress={() => act('reject')} />
                </ActionRow>
              )}
            </View>
          );
        }}
      />
      <ResultDialog info={notice} onClose={closeNotice} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, gap: 8, paddingBottom: 16 },
  centered: { flex: 1, justifyContent: 'center' },
  request: { ...pongmigosStyles.card, padding: 12, gap: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, backgroundColor: '#232326', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#B9BBC1', fontSize: 12, fontWeight: '700' },
});
