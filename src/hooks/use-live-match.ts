import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { matchesService, type LiveMatchState } from '@/services/matches.service';
import { toApiError, type ApiError } from '@/utils/api-error';

export function useLiveMatch(matchId: number, enabled: boolean, onChanged: () => void) {
  const [state, setState] = useState<LiveMatchState>();
  const [error, setError] = useState<ApiError>();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);

  const update = useCallback((next: LiveMatchState) => {
    setState((current) => !current || next.revision >= current.revision ? next : current);
    if (next.status !== 'CREATED') onChanged();
  }, [onChanged]);

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const next = await matchesService.live(matchId, controller.signal);
        if (!controller.signal.aborted) {
          update(next);
          setError(undefined);
        }
      } catch (err) {
        if (!controller.signal.aborted) setError(toApiError(err));
      }
      if (!controller.signal.aborted) timer = setTimeout(refresh, 1400);
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [enabled, matchId, update]));

  async function perform(action: 'READY' | 'POINT' | 'UNDO') {
    if (!enabled || !state || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const next = await matchesService.updateLive(matchId, action, state.revision);
      update(next);
      setError(undefined);
    } catch (err) {
      setError(toApiError(err));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return { state, error, busy, perform };
}
