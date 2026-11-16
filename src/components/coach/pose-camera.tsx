import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { buildPoseEngineHtml } from '@/services/pose/pose-engine-html';
import type { CameraFacing } from '@/types/pose';

type PoseCameraProps = {
  facing: CameraFacing;
  paused: boolean;
  onMessage: (data: string) => void;
  onLoadError: () => void;
};

export function PoseCamera({ facing, paused, onMessage, onLoadError }: PoseCameraProps) {
  const webViewRef = useRef<WebView<object>>(null);
  const initialFacing = useRef(facing).current;
  const html = useMemo(() => buildPoseEngineHtml(initialFacing), [initialFacing]);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(`window.__coach && window.__coach.setPaused(${paused}); true;`);
  }, [paused]);

  useEffect(() => {
    webViewRef.current?.injectJavaScript(`window.__coach && window.__coach.setFacing('${facing}'); true;`);
  }, [facing]);

  return (
    <WebView<object>
      ref={webViewRef}
      style={styles.webView}
      source={{ html, baseUrl: 'https://localhost/' }}
      originWhitelist={['*']}
      javaScriptEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      mediaCapturePermissionGrantType="grant"
      scrollEnabled={false}
      bounces={false}
      webviewDebuggingEnabled={__DEV__}
      onMessage={(event: WebViewMessageEvent) => onMessage(event.nativeEvent.data)}
      onError={onLoadError}
      onContentProcessDidTerminate={onLoadError}
      onRenderProcessGone={onLoadError}
    />
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1, backgroundColor: '#000000' },
});
