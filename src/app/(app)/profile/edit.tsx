import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Check, ImagePlus, Link2, Trash2, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { BrandIcon } from '@/components/common/brand-icon';
import { ProfileAvatar, ProfileIdentity } from '@/components/profile/profile-identity';
import { ProfileNetworks } from '@/components/profile/profile-networks';
import { ProfileScreen } from '@/components/profile/profile-screen';
import { Brand, Spacing } from '@/constants/theme';
import { useSession } from '@/context/session';
import { useToast } from '@/context/toast';
import { useFetch } from '@/hooks/use-fetch';
import { EMPTY_PROFILE, NETWORKS, normalizeSocialLink, toProfilePresentation, type Network, type ProfilePresentation } from '@/utils/profile-presentation';
import { playersService } from '@/services/players.service';
import type { PlayerResponse } from '@/types/api';

const networkKeys = Object.keys(NETWORKS) as Network[];

export default function EditProfileRoute() {
  const { player } = useSession();
  return player ? <ProfileEditor key={player.id} player={player} /> : null;
}

function ProfileEditor({ player }: { player: PlayerResponse }) {
  const { updateLocalPlayer } = useSession();
  const { showToast } = useToast();
  const [name, setName] = useState(player.name);
  const [data, setData] = useState(EMPTY_PROFILE);
  const [draftLinks, setDraftLinks] = useState(data.links);
  const [dialog, setDialog] = useState<'networks' | 'preview'>();
  const [problem, setProblem] = useState('');
  const [modalError, setModalError] = useState('');
  const loadingProfile = useFetch((signal) => playersService.presentation(player.id, signal), [player.id]);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loadingProfile.data) {
      setData(toProfilePresentation(loadingProfile.data));
      setName(loadingProfile.data.name);
    }
  }, [loadingProfile.data]);

  const choosePhoto = async () => {
    if (picking) return;
    setPicking(true);
    setProblem('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.65,
      });
      if (!result.canceled) {
        const photo = result.assets[0];
        if (!photo) return;
        const editor = ImageManipulator.manipulate(photo.uri);
        editor.resize(photo.width >= photo.height ? { width: 384 } : { height: 384 });
        const normalized = await editor.renderAsync();
        const resized = await normalized.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
        if (!resized.base64 || resized.base64.length > 239970) {
          setProblem('La foto es demasiado grande. Elige otra.');
          return;
        }
        setData((current) => ({ ...current, photo: `data:image/jpeg;base64,${resized.base64}` }));
      }
    } catch {
      setProblem('No pudimos abrir tu galería.');
    } finally {
      setPicking(false);
    }
  };

  const saveLinks = () => {
    const links = { ...draftLinks };
    for (const network of networkKeys) {
      try {
        links[network] = normalizeSocialLink(draftLinks[network], network);
      } catch {
        setModalError(`Revisa el enlace de ${NETWORKS[network].label}.`);
        return;
      }
    }
    setData((current) => ({ ...current, links }));
    setDialog(undefined);
  };

  const save = async () => {
    if (saving || !loadingProfile.data) return;
    const nextName = name.trim();
    if (!nextName) {
      setProblem('Escribe tu nombre visible.');
      return;
    }
    setProblem('');
    setSaving(true);
    try {
      const saved = await playersService.updatePresentation({
        ...data.links, name: nextName, photo: data.photo,
        city: data.city.trim(), description: data.description.trim(),
      });
      updateLocalPlayer({ ...player, name: saved.name });
      showToast('Perfil guardado.', 'success');
      if (router.canGoBack()) router.back();
      else router.replace('/profile');
    } catch {
      setProblem('No pudimos guardar tus cambios. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const unavailable = !loadingProfile.data || loadingProfile.loading || saving || picking;
  return (
    <ProfileScreen
      title="Editar perfil"
      back={{ label: 'Perfil', route: '/profile' }}
      footer={<AuthButton label="Guardar cambios" icon={Check} onPress={save} disabled={unavailable} loading={saving} />}>
      <View style={styles.card}>
        <View style={styles.photoRow}>
          <ProfileAvatar name={name} photo={data.photo} />
          <Text style={styles.heading}>Foto de perfil</Text>
        </View>
        <ActionRow>
          <AuthButton label="Elegir foto" icon={ImagePlus} variant="secondary" disabled={unavailable} loading={picking} onPress={choosePhoto} />
          {data.photo ? (
            <AuthButton label="Quitar foto" icon={Trash2} variant="text" disabled={unavailable} onPress={() => {
              setData((current) => ({ ...current, photo: null }));
            }} />
          ) : null}
        </ActionRow>
      </View>

      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.heading}>Información pública</Text>
        <Text style={styles.label}>Nombre visible</Text>
        <TextInput value={name} onChangeText={setName} maxLength={100} accessibilityLabel="Nombre visible" editable={!unavailable} style={styles.field} />
        <Text style={styles.label}>Ciudad o región <Text style={styles.secondary}>· Opcional</Text></Text>
        <TextInput value={data.city} onChangeText={(city) => setData((current) => ({ ...current, city }))} maxLength={60} accessibilityLabel="Ciudad o región" editable={!unavailable} style={styles.field} />
        <Text style={styles.label}>Descripción <Text style={styles.secondary}>· Opcional</Text></Text>
        <TextInput value={data.description} onChangeText={(description) => setData((current) => ({ ...current, description }))} maxLength={180} accessibilityLabel="Descripción" editable={!unavailable} style={[styles.field, styles.description]} multiline />
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text accessibilityRole="header" style={styles.heading}>Redes sociales</Text>
          <AuthButton label="Editar" icon={Link2} variant="text" disabled={unavailable} onPress={() => {
            setDraftLinks(data.links);
            setModalError('');
            setDialog('networks');
          }} />
        </View>
        <NetworkBadges links={data.links} />
      </View>
      <AuthButton label="Ver perfil público" icon={UserRound} variant="text" disabled={unavailable} onPress={() => setDialog('preview')} />
      {loadingProfile.error ? <AuthButton label="Reintentar cargar el perfil" variant="secondary" onPress={loadingProfile.refetch} /> : null}
      {problem ? <Text accessibilityRole="alert" style={styles.error}>{problem}</Text> : null}

      <Modal visible={Boolean(dialog)} transparent animationType="fade" onRequestClose={() => setDialog(undefined)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.backdrop} keyboardShouldPersistTaps="handled">
            <View style={styles.dialog} accessibilityViewIsModal>
              {dialog === 'networks' ? (
                <>
                  <Text accessibilityRole="header" style={styles.title}>Redes sociales</Text>
                  <Text style={styles.secondary}>Agrega los enlaces que quieras guardar.</Text>
                  {networkKeys.map((network) => (
                    <View key={network} style={styles.networkField}>
                      <View style={styles.fieldLabel}><BrandIcon name={network} color={Brand.cyan} size={16} /><Text style={styles.label}>{NETWORKS[network].label}</Text></View>
                      <TextInput
                        accessibilityLabel={NETWORKS[network].label}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        maxLength={180}
                        placeholder={`${NETWORKS[network].host}/usuario`}
                        placeholderTextColor={Brand.textDisabled}
                        value={draftLinks[network]}
                        style={styles.field}
                        onChangeText={(text) => { setDraftLinks((current) => ({ ...current, [network]: text })); setModalError(''); }}
                      />
                    </View>
                  ))}
                  {modalError ? <Text accessibilityRole="alert" style={styles.error}>{modalError}</Text> : null}
                  <AuthButton label="Guardar redes" icon={Check} onPress={saveLinks} />
                  <AuthButton label="Cancelar" variant="secondary" onPress={() => setDialog(undefined)} />
                </>
              ) : (
                <>
                  <Text accessibilityRole="header" style={styles.title}>Vista previa del perfil público</Text>
                  <ProfileIdentity name={name.trim() || player.name} username={player.username} data={data} />
                  <ProfileNetworks links={data.links} />
                  <AuthButton label="Volver a editar" variant="secondary" onPress={() => setDialog(undefined)} />
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ProfileScreen>
  );
}

function NetworkBadges({ links }: { links: ProfilePresentation['links'] }) {
  return (
    <View style={styles.networks}>
      {networkKeys.map((network) => (
        <View key={network} style={[styles.network, Boolean(links[network]) && styles.networkActive]}>
          <BrandIcon name={network} color={links[network] ? Brand.cyan : Brand.textDisabled} size={14} />
          <Text style={links[network] ? styles.networkActiveLabel : styles.secondary}>{NETWORKS[network].label}</Text>
          <Text style={styles.secondary}>{links[network] ? 'Agregada' : 'Sin enlace'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: Spacing.two, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  photoRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  title: { color: Brand.text, fontWeight: '800', fontSize: 23 },
  heading: { color: Brand.text, fontWeight: '700', fontSize: 16, flexShrink: 1 },
  label: { color: Brand.text, fontSize: 14, fontWeight: '600' },
  secondary: { color: Brand.textSecondary, fontSize: 12, lineHeight: 17 },
  error: { color: '#FFB3B8', fontSize: 13 },
  field: { minHeight: 44, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.background, color: Brand.text, fontSize: 15 },
  description: { minHeight: 76, textAlignVertical: 'top' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  networks: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  network: { flex: 1, minWidth: 80, alignItems: 'center', gap: 3, padding: 6, borderRadius: 10, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surfaceDisabled },
  networkActive: { borderColor: '#287280', backgroundColor: '#112933' },
  networkActiveLabel: { color: Brand.cyan, fontSize: 12 },
  backdrop: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.three, backgroundColor: '#000B' },
  dialog: { width: '100%', maxWidth: 380, padding: Spacing.three, gap: 10, borderRadius: 18, borderWidth: 1, borderColor: Brand.border, backgroundColor: Brand.surface },
  networkField: { gap: 4 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
