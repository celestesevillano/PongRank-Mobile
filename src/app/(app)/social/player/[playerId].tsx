import { Image } from 'expo-image';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Check, Send, Swords, UserCheck, UserPlus, X } from 'lucide-react-native';
import { useCallback } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActionRow } from '@/components/common/action-row';
import { CommunityScreen } from '@/components/communities/community-screen';
import { PlayerIdentity, PongmigoButton, PongiState, ResultDialog, challengePlayer, pongmigosStyles } from '@/components/pongmigos/pongmigos-ui';
import { Brand } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { usePongmigoAction } from '@/hooks/use-pongmigo-action';
import { friendOf, friendshipsService } from '@/services/friendships.service';
import { playersService } from '@/services/players.service';

export default function PublicPlayerScreen() {
  const { playerId } = useLocalSearchParams<{ playerId: string }>();
  const id = Number(playerId);
  const { player } = useSession();
  const self = player?.id;
  const profile = useFetch((signal) =>
    Number.isSafeInteger(id) && id > 0 ? playersService.summary(id, signal) : Promise.resolve(null), [id]);
  const relation = useFetch(async (signal) => {
    if (!self || self === id) return null;
    const [friends, inbox, outbox] = await Promise.all([
      friendshipsService.accepted(self, signal),
      friendshipsService.received(self, signal),
      friendshipsService.sent(self, signal),
    ]);
    return {
      friend: friends.find((item) => friendOf(item, self).id === id),
      received: inbox.find((item) => item.playerA.id === id),
      sent: outbox.find((item) => item.playerB.id === id),
    };
  }, [id, self]);
  const { pending, notice, perform, closeNotice } = usePongmigoAction(relation.refetch);

  useFocusEffect(useCallback(() => {
    profile.refetch();
    relation.refetch();
  }, [profile.refetch, relation.refetch]));

  const other = profile.data?.id === id ? profile.data : null;
  const { friend, received, sent } = relation.data ?? {};
  const working = pending !== null;
  const status = friend ? 'Ya son Pongmigos' : received ? 'Solicitud recibida' : sent ? 'Solicitud enviada' : null;
  const StatusIcon = friend ? UserCheck : received ? UserPlus : Send;

  return (
    <CommunityScreen title="Perfil" onBack={() => router.canGoBack() ? router.back() : router.replace('/social')}>
      {profile.loading && !other ? <ActivityIndicator color={Brand.red} /> :
        profile.error ? <PongiState error={profile.error} retry={profile.refetch} /> :
        !other ? <PongiState text="No encontramos a este jugador." /> :
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Image source={require('../../../../../assets/images/pongrank-public-profile.jpg')} contentFit="cover" style={styles.cover} accessibilityElementsHidden />
            <View style={styles.details}>
              <View style={styles.identity}>
                <PlayerIdentity player={other} />
                <Image source={require('../../../../../assets/images/pongrank-intro-paddle.png')} contentFit="contain" style={styles.brand} accessibilityElementsHidden />
              </View>
              {status && <View style={styles.badge}><StatusIcon size={14} color={friend ? '#2ECC71' : '#22D3EE'} />
                <Text style={[styles.badgeText, friend && styles.friend]}>{status}</Text></View>}
            </View>
          </View>
          <View style={styles.rating}>
            <Text style={styles.ratingValue}>{Math.round(other.ratingGlicko)}</Text>
            <Text style={pongmigosStyles.body}>Rating PongRank</Text>
          </View>
          {relation.error ? <PongiState error={relation.error} retry={relation.refetch} /> :
            relation.loading && !working ? <ActivityIndicator color={Brand.red} /> :
            friend ? <PongmigoButton label="Retar a una partida" icon={Swords} onPress={() => challengePlayer(other)} /> :
            received ? <ActionRow>
              <PongmigoButton label="Aceptar" icon={Check} busy={pending === 'accept'} disabled={working && pending !== 'accept'} onPress={() => void perform('accept', received.id)} />
              <PongmigoButton label="Rechazar" icon={X} variant="secondary" busy={pending === 'reject'} disabled={working && pending !== 'reject'} onPress={() => void perform('reject', received.id)} />
            </ActionRow> :
            sent ? <PongmigoButton label="Cancelar solicitud" icon={X} busy={pending === 'cancel'} onPress={() => void perform('cancel', sent.id)} /> :
            self && self !== id ? <PongmigoButton label="Enviar solicitud" icon={UserPlus} busy={pending === 'send'} onPress={() => void perform('send', id)} /> : null}
        </ScrollView>}
      <ResultDialog info={notice} onClose={closeNotice} />
    </CommunityScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: 12, paddingBottom: 16 },
  card: { ...pongmigosStyles.card, borderColor: '#294049', overflow: 'hidden' },
  cover: { width: '100%', height: 146 },
  details: { padding: 14, gap: 10 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brand: { position: 'absolute', left: 25, top: 25, width: 24, height: 24 },
  rating: { ...pongmigosStyles.card, padding: 14, alignItems: 'center', gap: 4, backgroundColor: '#0E2026' },
  ratingValue: { color: '#8BEAF7', fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'] },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#294049', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { color: '#22D3EE', fontSize: 12, fontWeight: '700' },
  friend: { color: '#2ECC71' },
});
