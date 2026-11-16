import * as Speech from 'expo-speech';
import { useEffect, useRef, useState } from 'react';

const STEADY_MS = 1200;
const MIN_GAP_MS = 4000;
const PREFERRED_LOCALES = ['es-us', 'es-mx', 'es-419', 'es-pe', 'es-es'];

type SpanishVoice = { identifier: string; language: string };

function rankVoice(voice: Speech.Voice) {
  const locale = voice.language.toLowerCase().replace('_', '-');
  const localeRank = PREFERRED_LOCALES.indexOf(locale);
  const enhanced = voice.quality === Speech.VoiceQuality.Enhanced ? 0 : 1;
  return (localeRank === -1 ? PREFERRED_LOCALES.length : localeRank) * 2 + enhanced;
}

export function useVoiceCoach(message: string | null, enabled: boolean) {
  const [voice, setVoice] = useState<SpanishVoice | null | undefined>(undefined);
  const lastSpoken = useRef<{ text: string; at: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Speech.getAvailableVoicesAsync()
      .then((voices) => {
        const spanish = voices.filter((candidate) => candidate.language.toLowerCase().startsWith('es')).sort((a, b) => rankVoice(a) - rankVoice(b));
        if (!cancelled) setVoice(spanish[0] ? { identifier: spanish[0].identifier, language: spanish[0].language } : null);
      })
      .catch(() => !cancelled && setVoice(null));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !message || !voice) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      const last = lastSpoken.current;
      if (last && (now - last.at < MIN_GAP_MS || last.text === message)) return;
      lastSpoken.current = { text: message, at: now };
      Speech.speak(message, { voice: voice.identifier, language: voice.language, rate: 1.05 });
    }, STEADY_MS);
    return () => clearTimeout(timer);
  }, [message, enabled, voice]);

  useEffect(() => {
    if (!enabled) Speech.stop();
  }, [enabled]);

  useEffect(() => () => void Speech.stop(), []);

  return { voiceStatus: voice === undefined ? 'checking' : voice ? 'ready' : 'missing' } as const;
}
