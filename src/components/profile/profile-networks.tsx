import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BrandIcon } from '@/components/common/brand-icon';
import { Brand, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast';
import { NETWORKS, normalizeSocialLink, type Network, type ProfilePresentation } from '@/utils/profile-presentation';

const networks = Object.keys(NETWORKS) as Network[];

export function ProfileNetworks({ links }: { links: ProfilePresentation['links'] }) {
  const { showToast } = useToast();
  return (
    <View style={styles.row}>
      {networks.map((network) => {
        const active = Boolean(links[network]);
        const color = active ? Brand.cyan : Brand.textDisabled;
        const open = async () => {
          try {
            const url = normalizeSocialLink(links[network], network);
            if (url) await Linking.openURL(url);
          } catch {
            showToast('No pudimos abrir esta red social.', 'error');
          }
        };

        return (
          <Pressable key={network} disabled={!active} onPress={open} accessibilityRole={active ? 'link' : undefined} accessibilityState={{ disabled: !active }} style={[styles.network, active && styles.active]}>
            <BrandIcon name={network} color={color} size={14} />
            <Text style={[styles.label, { color }]}>{NETWORKS[network].label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  network: { flex: 1, minWidth: 82, minHeight: 44, flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.one, borderRadius: 10, backgroundColor: Brand.surfaceDisabled, borderWidth: 1, borderColor: Brand.border },
  active: { backgroundColor: '#112933', borderColor: '#287280' },
  label: { fontSize: 12, fontWeight: '600' },
});
