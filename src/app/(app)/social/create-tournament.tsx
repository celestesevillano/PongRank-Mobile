import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { ArrowRight, Check, GitFork, Trophy, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { AuthInput } from '@/components/auth/auth-input';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ScreenState } from '@/components/common/screen-state';
import { CommunityScreen } from '@/components/communities/community-screen';
import { MatchSchedule } from '@/components/matches/match-schedule';
import { formatLabels, MatchNotice } from '@/components/matches/match-ui';
import { PlayerIdentity } from '@/components/pongmigos/pongmigos-ui';
import { BracketReview } from '@/components/tournaments/bracket-review';
import { validateParticipantCount } from '@/components/tournaments/bracket-model';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useFetch } from '@/hooks/use-fetch';
import { clubsService } from '@/services/clubs.service';
import { tournamentsService, type TournamentFormat } from '@/services/tournaments.service';
import { toApiError } from '@/utils/api-error';

const formats = ['BO3', 'BO5', 'BO7'] as const;
const titles = ['Crear torneo', 'Seleccionar participantes', 'Revisar llave'] as const;

export default function CreateTournamentScreen() {
  const { clubId: clubParam } = useLocalSearchParams<{ clubId: string }>();
  const clubId = Number(clubParam);
  const club = useFetch((signal) => clubsService.detail(clubId, signal), [clubId]);
  const { player } = useSession();
  const authorized = !!player && club.data?.admin?.id === player.id && club.data.status === 'APPROVED';
  const members = useFetch((signal) => authorized ? clubsService.allMembers(clubId, signal) : Promise.resolve([]), [clubId, authorized]);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [format, setFormat] = useState<TournamentFormat | null>(null);
  const [selected, setSelected] = useState<ReadonlySet<number>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const requestInFlight = useRef(false);
  const publication = useRef<{ fingerprint: string; key: string } | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (step === 0) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!requestInFlight.current) setStep(step === 2 ? 1 : 0);
      return true;
    });
    return () => sub.remove();
  }, [step]);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: step === 0 && !publishing });
  }, [navigation, step, publishing]);

  const back = () => {
    if (requestInFlight.current) return;
    if (step > 0) setStep(step === 2 ? 1 : 0);
    else if (router.canGoBack()) router.back();
    else router.replace('/social');
  };

  const candidates = [...new Map((members.data ?? []).flatMap(({ player: member }) => member ? [[member.id, member] as const] : [])).values()]
    .sort((a, b) => b.ratingGlicko - a.ratingGlicko || a.id - b.id);
  const entrants = candidates.filter((member) => selected.has(member.id))
    .map((member) => ({ id: member.id, name: member.name, rating: member.ratingGlicko }));

  async function publish() {
    if (!authorized || !format || !date || !name.trim() || validateParticipantCount(entrants.length) || requestInFlight.current) return;
    setConfirmPublish(false);
    requestInFlight.current = true;
    setPublishing(true);
    const draft = { clubId, name: name.trim(), matchFormat: format, scheduledAt: date.toISOString(), playerIds: entrants.map(({ id }) => id) };
    const fingerprint = JSON.stringify(draft);
    if (publication.current?.fingerprint !== fingerprint) {
      publication.current = { fingerprint, key: `${Date.now()}-${Math.random().toString(36).slice(2)}` };
    }
    try {
      const tournament = await tournamentsService.publish({ ...draft, publicationKey: publication.current.key });
      router.replace({ pathname: '/social/tournament', params: { id: tournament.id } });
    } catch (error) {
      setNotice(toApiError(error).message);
    } finally {
      requestInFlight.current = false;
      setPublishing(false);
    }
  }

  return <CommunityScreen title={titles[step]} onBack={back}>
    {club.loading || club.error ? <ScreenState loading={club.loading} error={club.error} onRetry={club.refetch} />
      : !authorized ? <Text style={styles.copy}>Solo la administración de un club activo puede crear torneos.</Text>
      : <>
        <Text style={styles.copy}>Paso {step + 1} de 3</Text>
        {step === 0 ? <View style={styles.form}>
          <Text style={styles.label}>Nombre del torneo *</Text>
          <AuthInput accessibilityLabel="Nombre del torneo" placeholder="Ej. Copa Miraflores" value={name} onChangeText={setName} maxLength={150} />
          <Text style={styles.label}>Fecha y hora *</Text>
          <MatchSchedule required value={date} onChange={setDate} />
          <Text style={styles.label}>Formato del torneo *</Text>
          <View style={styles.formats}>{formats.map((option) => (
            <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: format === option }}
              onPress={() => setFormat(option)} style={[styles.chip, option === format && styles.activeChip]}>
              <Text style={styles.label}>{formatLabels[option]}</Text>
            </Pressable>
          ))}</View>
          <View style={styles.fill} />
          <AuthButton label="Continuar" icon={ArrowRight} disabled={!name.trim() || !date || !format} onPress={() => setStep(1)} />
        </View> : step === 1 ? <>
          <MatchNotice icon={Users} title={`${entrants.length} seleccionados`} message="Elige al menos 4 miembros del club. El total debe ser múltiplo de 4." />
          {members.loading || members.error ? <ScreenState loading={members.loading} error={members.error} onRetry={members.refetch} />
            : <FlatList style={styles.fill} data={candidates} keyExtractor={({ id }) => String(id)} contentContainerStyle={styles.list}
              ListEmptyComponent={<Text style={styles.copy}>Todavía no hay miembros para seleccionar.</Text>}
              renderItem={({ item }) => {
                const checked = selected.has(item.id);
                return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} style={[styles.member, checked && styles.selected]}
                  onPress={() => setSelected((current) => {
                    const next = new Set(current);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })}>
                  <PlayerIdentity player={item} showRating />
                  {checked && <Check size={20} color={Brand.cyan} />}
                </Pressable>;
              }} />}
          <View style={styles.footer}><AuthButton label="Revisar llave" icon={GitFork} disabled={members.loading || !!members.error} onPress={() => {
            const issue = validateParticipantCount(entrants.length);
            if (issue) setNotice(issue);
            else setStep(2);
          }} /></View>
        </> : <BracketReview entrants={entrants} onPublish={() => setConfirmPublish(true)} publishing={publishing} />}
      </>}
    <ConfirmDialog confirmation={notice ? {
      title: notice, message: 'Revisa los datos e inténtalo de nuevo.', Icon: Users,
      label: 'Aceptar', infoOnly: true, onConfirm: () => setNotice(null),
    } : confirmPublish ? {
      title: '¿Publicar torneo?', message: 'La llave quedará disponible para el club y se asignarán los primeros partidos.',
      Icon: Trophy, label: 'Publicar torneo', onConfirm: () => void publish(),
    } : null} busy={publishing} onCancel={() => { setNotice(null); setConfirmPublish(false); }} />
  </CommunityScreen>;
}

const styles = StyleSheet.create({
  form: { flex: 1, gap: Spacing.two, paddingVertical: Spacing.three },
  copy: { color: Brand.textSecondary, marginBottom: 4 },
  label: { color: Brand.text, fontWeight: '700' },
  fill: { flex: 1 },
  formats: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, alignItems: 'center', borderRadius: 24, borderWidth: 1, borderColor: Brand.border, paddingVertical: 10, backgroundColor: Brand.surface },
  activeChip: { backgroundColor: Brand.primary, borderColor: Brand.primary },
  list: { gap: Spacing.two, paddingVertical: Spacing.two },
  member: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: Brand.surface, borderColor: Brand.border, borderWidth: 1, borderRadius: 14, padding: 10 },
  selected: { borderColor: Brand.cyan },
  footer: { paddingVertical: Spacing.three },
});
