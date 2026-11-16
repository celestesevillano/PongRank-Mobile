import { useCameraPermissions } from 'expo-camera';
import { useEffect, useRef } from 'react';

export type CameraAccess = 'checking' | 'granted' | 'prompt' | 'blocked';

export function useCameraAccess() {
  const [permission, requestPermission] = useCameraPermissions();
  const askedOnce = useRef(false);

  const access: CameraAccess = !permission ? 'checking' : permission.granted ? 'granted' : permission.canAskAgain ? 'prompt' : 'blocked';

  useEffect(() => {
    if (access !== 'prompt' || askedOnce.current) return;
    askedOnce.current = true;
    requestPermission();
  }, [access, requestPermission]);

  return { access, request: requestPermission };
}
