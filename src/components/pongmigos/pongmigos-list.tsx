import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, ChevronRight, Ellipsis, Send, Swords, UserMinus, UserPlus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AuthInput } from '@/components/auth/auth-input';
import { ActionRow } from '@/components/common/action-row';
import { CardLighting } from '@/components/common/card-lighting';
import { PlayerIdentity, PongmigoButton, PongiState, ResultDialog, challengePlayer, openPlayer, pongiArt, pongmigosStyles } from '@/components/pongmigos/pongmigos-ui';
import { Brand } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePongmigoAction } from '@/hooks/use-pongmigo-action';
import { friendOf, friendshipsService, type Friendship } from '@/services/friendships.service';

export function PongmigosList({ preview = false }: { preview?: boolean }) {
  const { player } = useSession();
  const playerId = player?.id;
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState<{ item: Friendship; y: number } | null>(null);
  const [removing, setRemoving] = useState<Friendship | null>(null);
  const friends = useFetch((signal) => playerId ? friendshipsService.accepted(playerId, signal) : Promise.resolve([]), [playerId]);
  const received = useFetch((signal) => preview && playerId ? friendshipsService.received(playerId, signal) : Promise.resolve([]), [preview, playerId]);
  const { pending, notice, perform, closeNotice } = usePongmigoAction(friends.refetch);

  useFocusEffect(useCallback(() => {
    friends.refetch();
    received.refetch();
  }, [friends.refetch, received.refetch]));

  if (!playerId) return null;
  const list = friends.data ?? [];
  const term = query.trim().toLocaleLowerCase();
  const shown = preview ? list.slice(0, 5) : list.filter((item) => {
    const other = friendOf(item, playerId);
    return other.name.toLocaleLowerCase().includes(term) || Boolean(other.username?.toLocaleLowerCase().includes(term.replace(/^@/, '')));
  });
  const count = received.data?.length ?? 0;

  return (
    <View style={styles.container}>
      {!preview && <View style={styles.search}><AuthInput value={query} onChangeText={setQuery} placeholder="Buscar en tu lista" accessibilityLabel="Buscar en tu lista" autoCorrect={false} /></View>}
      <FlatList
        data={shown}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={preview ? <View style={styles.header}>
          <View style={styles.banner}>
            <CardLighting color="#E8262F" />
            <View style={styles.bannerCopy}>
              <Text style={styles.bannerTitle}>Mis Pongmigos</Text>
              {friends.data && <Text style={styles.bannerCount}>{list.length} {list.length === 1 ? 'Pongmigo' : 'Pongmigos'}</Text>}
            </View>
            <Image source={pongiArt.banner} style={styles.bannerArt} contentFit="contain" accessibilityElementsHidden />
          </View>
          <Pressable style={styles.entry} accessibilityRole="button"
            accessibilityLabel={count > 0 ? `Solicitudes recibidas, ${count} pendientes` : 'Solicitudes recibidas'}
            onPress={() => router.push({ pathname: '/social/requests', params: { box: 'received' } })}>
            <UserPlus size={20} color="#22D3EE" /><Text style={styles.entryLabel}>Solicitudes recibidas</Text>
            {count > 0 && <Text style={styles.count}>{count}</Text>}<ChevronRight size={18} color="#B9BBC1" />
          </Pressable>
          <Pressable style={styles.entry} accessibilityRole="button" onPress={() => router.push({ pathname: '/social/requests', params: { box: 'sent' } })}>
            <Send size={20} color="#22D3EE" /><Text style={styles.entryLabel}>Solicitudes enviadas</Text><ChevronRight size={18} color="#B9BBC1" />
          </Pressable>
          <Text accessibilityRole="header" style={pongmigosStyles.heading}>Tu lista</Text>
        </View> : undefined}
        ListEmptyComponent={friends.loading ? <ActivityIndicator color={Brand.red} />
          : friends.error ? <PongiState error={friends.error} retry={friends.refetch} />
          : <Text style={pongmigosStyles.body}>{term ? 'No encontramos coincidencias.' : 'Aún no tienes Pongmigos'}</Text>}
        ListFooterComponent={friends.error && list.length > 0 ? <PongiState error={friends.error} retry={friends.refetch} /> : preview && list.length > 5 ? <PongmigoButton label="Ver todos mis Pongmigos" icon={ArrowRight}
          variant="text" onPress={() => router.push('/social/pongmigos')} /> : undefined}
        renderItem={({ item }) => {
          const other = friendOf(item, playerId);
          return (
            <View style={styles.row}>
              <Pressable style={styles.rowProfile} accessibilityRole="button" onPress={() => openPlayer(other)}>
                <PlayerIdentity player={other} />
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={`Opciones de ${other.name}`} disabled={pending !== null} style={styles.more}
                onPress={(event) => setMenu({ item, y: event.nativeEvent.pageY })}>
                <Ellipsis size={20} color={Brand.text} />
              </Pressable>
            </View>
          );
        }}
      />
      {menu && <Modal transparent statusBarTranslucent onRequestClose={() => setMenu(null)}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Cerrar opciones" onPress={() => setMenu(null)} />
        <View accessibilityViewIsModal style={[styles.menu, { top: Math.min(Math.max(menu.y + 8, 16), height - 118) }]}>
          <PongmigoButton label="Retar a una partida" icon={Swords} variant="text" onPress={() => {
            const other = friendOf(menu.item, playerId);
            setMenu(null);
            challengePlayer(other);
          }} />
          <Pressable accessibilityRole="button" style={styles.removeAction} onPress={() => { setRemoving(menu.item); setMenu(null); }}>
            <UserMinus size={17} color="#FF989E" /><Text style={styles.removeCopy}>Eliminar Pongmigo</Text>
          </Pressable>
        </View>
      </Modal>}
      {removing && <Modal transparent animationType="fade" onRequestClose={() => setRemoving(null)}>
        <ScrollView contentContainerStyle={styles.backdrop}>
          <View accessibilityViewIsModal style={styles.decision}>
            <Text accessibilityRole="header" style={styles.bannerTitle}>¿Eliminar a {friendOf(removing, playerId).name}?</Text>
            <Text style={pongmigosStyles.body}>Para volver, envíale otra solicitud.</Text>
            <ActionRow>
              <PongmigoButton label="Eliminar Pongmigo" onPress={() => {
                const id = removing.id;
                setRemoving(null);
                void perform('remove', id);
              }} disabled={pending !== null} />
              <PongmigoButton label="Cancelar" variant="secondary" onPress={() => setRemoving(null)} />
            </ActionRow>
          </View>
        </ScrollView>
      </Modal>}
      <ResultDialog info={notice} onClose={closeNotice} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { marginBottom: 10 },
  list: { gap: 8, paddingBottom: 16 },
  header: { gap: 8 },
  banner: { flexDirection: 'row', alignItems: 'center', minHeight: 106, borderRadius: 14, backgroundColor: '#27151A', borderWidth: 1, borderColor: '#71333C', overflow: 'hidden' },
  bannerCopy: { flex: 1, gap: 5, padding: 12 },
  bannerTitle: { color: Brand.text, fontSize: 21, fontWeight: '800' },
  bannerCount: { color: '#FFC3C8', fontSize: 15, fontWeight: '700' },
  bannerArt: { width: 104, height: 104, alignSelf: 'flex-end' },
  entry: { ...pongmigosStyles.card, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, padding: 8 },
  entryLabel: { color: Brand.text, fontSize: 14, fontWeight: '700', flex: 1 },
  count: { color: Brand.text, backgroundColor: '#D81E28', minWidth: 22, borderRadius: 11, paddingHorizontal: 5, paddingVertical: 3, textAlign: 'center', fontWeight: '800' },
  row: { ...pongmigosStyles.card, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, minHeight: 56 },
  rowProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  more: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  menu: { ...pongmigosStyles.card, position: 'absolute', right: 18, padding: 4 },
  removeAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, gap: 6 },
  removeCopy: { color: '#FF989E', fontSize: 15, fontWeight: '700' },
  backdrop: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000A', padding: 16 },
  decision: { ...pongmigosStyles.card, width: '100%', maxWidth: 320, padding: 15, gap: 10 },
});
