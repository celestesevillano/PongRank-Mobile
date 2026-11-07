import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PillTabs } from '@/components/common/pill-tabs';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';

const SEGMENTS = [
  { key: 'communities', label: 'Comunidades' },
  { key: 'clubs', label: 'Clubes' },
  { key: 'friends', label: 'Amigos' },
] as const;

type Segment = (typeof SEGMENTS)[number]['key'];

const COMING_SOON: Record<Segment, string> = {
  communities: 'Aquí verás tus comunidades, podrás crear una y descubrir otras.',
  clubs: 'Aquí verás tus clubes y podrás pedir ingreso a otros.',
  friends: 'Aquí verás tus amigos y las solicitudes pendientes.',
};

export default function SocialScreen() {
  const [segment, setSegment] = useState<Segment>('communities');

  return (
    <ScreenContainer title="Social">
      <PillTabs options={SEGMENTS} selected={segment} onSelect={setSegment} />
      <View style={styles.placeholder}>
        <Text style={styles.message}>{COMING_SOON[segment]}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: { padding: Spacing.three, borderRadius: Spacing.three, borderWidth: 1, borderStyle: 'dashed', borderColor: Brand.border },
  message: { color: Brand.textSecondary, fontSize: 14, textAlign: 'center' },
});
