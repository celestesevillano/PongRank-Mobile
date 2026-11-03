import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export type RegistrationDraft = { name: string; email: string; password: string };

type RegistrationContextValue = {
  draft: RegistrationDraft | null;
  saveDraft: (draft: RegistrationDraft) => void;
  clearDraft: () => void;
};

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export function RegistrationProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);

  const value = useMemo(() => ({ draft, saveDraft: setDraft, clearDraft: () => setDraft(null) }), [draft]);

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error('useRegistration debe usarse dentro de un RegistrationProvider');
  }
  return ctx;
}
