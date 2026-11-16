import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

const banners = {
  communities: {
    title: 'Mis comunidades',
    artwork: require('../../../assets/images/pongrank-comunidades-banner.webp'),
    background: '#0B2229',
    border: '#28616C',
    accent: '#AAEFF7',
  },
  clubs: {
    title: 'Mis clubes',
    artwork: require('../../../assets/images/pongrank-clubes-social-equipo.webp'),
    background: '#000000',
    border: '#715426',
    accent: '#FFD278',
  },
  friends: {
    title: 'Mis Pongmigos',
    artwork: require('../../../assets/images/pongrank-pongmigos-social-rojo.webp'),
    background: '#000000',
    border: '#71333C',
    accent: '#FFC3C8',
  },
} as const;

export function SocialBanner({ kind, subtitle }: { kind: keyof typeof banners; subtitle?: string }) {
  const { title, artwork, background, border, accent } = banners[kind];

  return (
    <View style={[styles.banner, { backgroundColor: background, borderColor: border }]}>
      <Image
        source={artwork}
        contentFit="cover"
        contentPosition={kind === 'communities' ? 'right center' : 'right top'}
        style={StyleSheet.absoluteFill}
        accessible={false}
      />
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        {subtitle !== undefined && <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 109,
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 16,
  },
  copy: { alignSelf: 'flex-start', maxWidth: '66%', padding: Spacing.three, paddingRight: Spacing.one, gap: 3 },
  title: { color: Brand.text, fontSize: 19, lineHeight: 23, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 4 },
  subtitle: { fontSize: 13, lineHeight: 18, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 4 },
});
