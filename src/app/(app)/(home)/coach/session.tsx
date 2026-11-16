import { router, useIsFocused } from 'expo-router';
import { ChevronLeft, SwitchCamera } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { CoachNotice } from '@/components/coach/coach-notice';
import { PoseCamera } from '@/components/coach/pose-camera';
import { ScreenContainer } from '@/components/common/screen-container';
import { Brand, Spacing } from '@/constants/theme';
import { useCameraAccess } from '@/hooks/use-camera-access';
import { usePoseTracking, type PoseEngineStatus } from '@/hooks/use-pose-tracking';
import type { CameraFacing } from '@/types/pose';

const STATUS_LABELS: Record<Exclude<PoseEngineStatus, 'error'>, string> = {
  starting: 'Abriendo la cámara…',
  'loading-model': 'Cargando MediaPipe…',
  ready: 'Analizando',
};

export default function CoachSessionScreen() {
  const focused = useIsFocused();
  const { access, request } = useCameraAccess();
  const tracking = usePoseTracking();
  const [facing, setFacing] = useState<CameraFacing>('user');

  const notice = access === 'prompt' || access === 'blocked' ? access : tracking.status === 'error' ? tracking.error : null;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" hitSlop={12} onPress={() => router.back()}>
          <ChevronLeft color={Brand.text} size={26} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>Coach</Text>
      </View>

      <View style={styles.stage}>
        {notice ? (
          <CoachNotice reason={notice} onRetry={access === 'granted' ? tracking.restart : request} />
        ) : access === 'granted' && focused ? (
          <>
            <PoseCamera
              key={tracking.engineKey}
              facing={facing}
              paused={false}
              onMessage={tracking.handleMessage}
              onLoadError={tracking.handleLoadError}
            />
            <View style={styles.statusChip} accessibilityLiveRegion="polite">
              {tracking.status !== 'ready' && <ActivityIndicator size="small" color={Brand.cyan} />}
              <Text style={styles.statusText}>
                {tracking.status === 'ready' ? (tracking.personDetected ? `Te veo · ${tracking.fps} fps` : 'Aléjate hasta que se vea tu cuerpo') : STATUS_LABELS[tracking.status as Exclude<PoseEngineStatus, 'error'>]}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={facing === 'user' ? 'Usar cámara trasera' : 'Usar cámara frontal'}
              style={({ pressed }) => [styles.flip, pressed && styles.pressed]}
              onPress={() => setFacing((current) => (current === 'user' ? 'environment' : 'user'))}>
              <SwitchCamera color={Brand.text} size={22} />
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={Brand.cyan} style={styles.loader} />
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginVertical: Spacing.three },
  title: { color: Brand.text, fontSize: 26, fontWeight: '800' },
  stage: { flex: 1, marginBottom: Spacing.three, borderRadius: 16, overflow: 'hidden', backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, justifyContent: 'center' },
  statusChip: { position: 'absolute', top: Spacing.three, left: Spacing.three, flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.65)' },
  statusText: { color: Brand.text, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  flip: { position: 'absolute', bottom: Spacing.three, right: Spacing.three, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
  loader: { alignSelf: 'center' },
});
