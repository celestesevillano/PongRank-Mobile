import { Minus, Plus, LocateFixed, Trophy } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { Brand } from '@/constants/theme';
import { CARD, HEIGHT, positionBracket } from './bracket-layout';
import type { Bout, Bracket } from './bracket-model';

const GOLD = '#FFD278';
const MAX_ZOOM = 1.5;
const MIN_ZOOM = 0.55;

function bound(value: number, viewport: number, content: number, zoom: number) {
  'worklet';
  const limit = Math.max(0, (content * zoom - viewport) / 2);
  return Math.min(limit, Math.max(-limit, value));
}

function BoutCard({ bout, final }: { bout: Bout; final?: boolean }) {
  return (
    <View style={[styles.card, final && styles.final]}>
      <Text style={[styles.boutTitle, final && styles.gold]}>{bout.title}</Text>
      {bout.slots.map((slot, i) => (
        <View key={i} style={styles.slot}>
          <Text numberOfLines={2} style={styles.name}>{slot.name}</Text>
          {slot.entry ? <Text style={styles.entry}>{slot.entry}</Text> : null}
        </View>
      ))}
    </View>
  );
}

export function BracketDiagram({ bracket }: { bracket: Bracket }) {
  const layout = useMemo(() => positionBracket(bracket), [bracket]);
  const viewportWidth = useSharedValue(0);
  const viewportHeight = useSharedValue(0);
  const zoom = useSharedValue(1);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const lastZoom = useSharedValue(1);
  const [measured, setMeasured] = useState(false);
  const { width, height } = layout;

  const pan = Gesture.Pan().onChange(({ changeX, changeY }) => {
    offsetX.value = bound(offsetX.value + changeX, viewportWidth.value, width, zoom.value);
    offsetY.value = bound(offsetY.value + changeY, viewportHeight.value, height, zoom.value);
  });
  const pinch = Gesture.Pinch().onStart(() => { lastZoom.value = zoom.value; }).onUpdate(({ scale }) => {
    zoom.value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, lastZoom.value * scale));
    offsetX.value = bound(offsetX.value, viewportWidth.value, width, zoom.value);
    offsetY.value = bound(offsetY.value, viewportHeight.value, height, zoom.value);
  });
  const shift = useAnimatedStyle(() => ({
    left: (viewportWidth.value - width) / 2,
    top: (viewportHeight.value - height) / 2,
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }, { scale: zoom.value }],
  }));

  function measure({ nativeEvent }: LayoutChangeEvent) {
    viewportWidth.value = nativeEvent.layout.width;
    viewportHeight.value = nativeEvent.layout.height;
    setMeasured(true);
  }

  function changeZoom(amount: number) {
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value + amount));
    zoom.value = next;
    offsetX.value = bound(offsetX.value, viewportWidth.value, width, next);
    offsetY.value = bound(offsetY.value, viewportHeight.value, height, next);
  }

  function center() {
    zoom.value = 1;
    offsetX.value = 0;
    offsetY.value = 0;
  }

  return (
    <GestureHandlerRootView style={styles.diagram}>
      <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
        <View style={styles.viewport} onLayout={measure} collapsable={false}>
          {measured ? <Animated.View style={[styles.canvas, { width, height }, shift]}>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
              {layout.edges.map(({ id, path }) => <Path key={id} d={path} fill="none" stroke={Brand.textSecondary} strokeWidth={1.5} />)}
            </Svg>
            {layout.headers.map(({ title, x }) => <Text key={`${title}-${x}`} style={[styles.header, { left: x }]}>{title}</Text>)}
            {layout.nodes.map(({ bout, x, y, final }) =>
              <View key={bout.id} style={[styles.node, { left: x - CARD / 2, top: y - HEIGHT / 2 }]}>
                {final ? (
                  <View style={styles.finalTrophy} pointerEvents="none" accessible={false}>
                    <Trophy size={22} color={GOLD} />
                  </View>
                ) : null}
                <BoutCard bout={bout} final={final} />
              </View>)}
          </Animated.View> : null}
        </View>
      </GestureDetector>
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="Alejar" style={styles.control} onPress={() => changeZoom(-0.2)}><Minus size={18} color={Brand.text} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Centrar en la final" style={styles.control} onPress={center}><LocateFixed size={18} color={Brand.cyan} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Acercar" style={styles.control} onPress={() => changeZoom(0.2)}><Plus size={18} color={Brand.text} /></Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  diagram: { flex: 1, minHeight: 0 },
  viewport: { flex: 1, overflow: 'hidden', backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border, borderRadius: 14 },
  canvas: { position: 'absolute' },
  header: { position: 'absolute', top: 10, width: CARD, textAlign: 'center', color: Brand.text, fontSize: 13, fontWeight: '700' },
  node: { position: 'absolute', width: CARD },
  card: { minHeight: HEIGHT, borderWidth: 1, borderColor: Brand.secondaryBorder, backgroundColor: Brand.background, borderRadius: 10, padding: 8, gap: 4 },
  final: { borderColor: GOLD },
  gold: { color: GOLD, fontWeight: '700' },
  finalTrophy: { position: 'absolute', bottom: '100%', left: 0, right: 0, alignItems: 'center', marginBottom: 9 },
  boutTitle: { color: Brand.text, fontSize: 12, fontWeight: '700' },
  slot: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  name: { flex: 1, color: Brand.text, fontSize: 12 },
  entry: { color: Brand.textSecondary, fontSize: 10 },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: 4 },
  control: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
