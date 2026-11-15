import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Spacing } from '@/constants/theme';

const artwork = require('../../../assets/images/pongrank-comunidades-banner.webp');

export function CommunitiesBanner({ communityCount, used, limit }: {
  communityCount?: number;
  used?: number;
  limit?: number;
}) {
  const quota = used !== undefined && limit !== undefined ? `${used} de ${limit} espacios usados` : null;

  return (
    <View style={styles.banner}>
      <Image source={artwork} contentFit="cover" contentPosition="right center" style={StyleSheet.absoluteFill} accessible={false} />
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>Mis comunidades</Text>
        {quota ? <Text style={styles.quota}>{quota}</Text> : null}
        {!quota && communityCount !== undefined ? (
          <Text style={styles.quota}>{communityCount} {communityCount === 1 ? 'comunidad' : 'comunidades'}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { minHeight: 109, justifyContent: 'center', overflow: 'hidden', borderColor: '#28616C', borderWidth: 1, borderRadius: 16, backgroundColor: '#0B2229' },
  copy: { alignSelf: 'flex-start', maxWidth: '61%', padding: Spacing.three, gap: 3 },
  title: { color: Brand.text, fontSize: 19, lineHeight: 23, fontWeight: '800', textShadowColor: '#000', textShadowRadius: 4 },
  quota: { color: '#AAEFF7', fontSize: 13, lineHeight: 18, fontWeight: '600', textShadowColor: '#000', textShadowRadius: 4 },
});
