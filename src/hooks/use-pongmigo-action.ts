import { Send, Undo2, UserCheck, UserMinus, X } from 'lucide-react-native';
import { useRef, useState } from 'react';

import { useToast } from '@/context/toast';
import { friendshipsService } from '@/services/friendships.service';
import type { ResultNotice } from '@/components/pongmigos/pongmigos-ui';
import { toApiError } from '@/utils/api-error';

const actions = {
  send: { run: friendshipsService.send, title: 'Solicitud enviada', message: 'Puedes verla en Enviadas.', icon: Send },
  accept: { run: friendshipsService.accept, title: 'Ya son Pongmigos', message: 'Ya aparece en tu lista.', icon: UserCheck, success: true },
  reject: { run: friendshipsService.reject, title: 'Solicitud rechazada', message: 'Ya no aparece en Recibidas.', icon: X },
  cancel: { run: friendshipsService.cancel, title: 'Solicitud cancelada', message: 'Ya no aparece en Enviadas.', icon: Undo2 },
  remove: { run: friendshipsService.remove, title: 'Pongmigo eliminado', message: 'Ya no aparece en tu lista.', icon: UserMinus },
};

type Action = keyof typeof actions;

export function usePongmigoAction(refetch: () => void) {
  const { showToast } = useToast();
  const inFlight = useRef(false);
  const [pending, setPending] = useState<Action | null>(null);
  const [notice, setNotice] = useState<ResultNotice | null>(null);

  const perform = async (action: Action, id: number) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(action);
    try {
      await actions[action].run(id);
      setNotice(actions[action]);
    } catch (err) {
      const error = toApiError(err);
      showToast(error.isNetwork ? 'No pudimos conectar con PongRank' : 'No pudimos completar la acción. Actualiza e intenta de nuevo.', 'error');
    } finally {
      inFlight.current = false;
      setPending(null);
      refetch();
    }
  };

  return { pending, notice, perform, closeNotice: () => setNotice(null) };
}
