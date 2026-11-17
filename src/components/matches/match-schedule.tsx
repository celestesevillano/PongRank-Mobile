import DateTimePicker from '@expo/ui/community/datetime-picker';
import { CalendarClock, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ActionRow } from '@/components/common/action-row';
import { Brand } from '@/constants/theme';

export function matchTime(when: Date | string) {
  return new Date(when).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
}

export function MatchSchedule({ value, onChange }: { value: Date | null; onChange: (date: Date | null) => void }) {
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [draft, setDraft] = useState(() => new Date(Date.now() + 3600000));
  const close = () => setPicker(null);
  const valid = draft.getTime() > Date.now();

  return <>
    <ActionRow>
      <AuthButton label="Ahora mismo" variant="secondary" icon={Clock} accessibilityState={{ selected: !value }} style={!value ? styles.selected : undefined} onPress={() => onChange(null)} />
      <AuthButton label="Programar" variant="secondary" icon={CalendarClock} onPress={() => {
        setDraft(value && value.getTime() > Date.now() ? value : new Date(Date.now() + 3600000));
        setPicker('date');
      }} />
    </ActionRow>
    {!!value && <Text style={styles.label}>{matchTime(value)}</Text>}
    {picker && (Platform.OS === 'android'
      ? <DateTimePicker key={picker} value={draft} mode={picker} minimumDate={picker === 'date' ? new Date() : undefined}
          onDismiss={close} onValueChange={(_, date) => {
            setDraft(date);
            if (picker === 'date') setPicker('time');
            else { onChange(date); close(); }
          }} />
      : <Modal transparent visible onRequestClose={close} animationType="fade">
          <View style={styles.backdrop}><View style={styles.dialog}>
            <Text style={styles.title}>Programar partida</Text>
            {Platform.OS === 'web' ? <Text style={styles.label}>El selector está disponible en iOS y Android.</Text>
              : <DateTimePicker value={draft} mode="datetime" display="spinner" minimumDate={new Date()} themeVariant="dark"
                  accentColor={Brand.cyan} onValueChange={(_, date) => setDraft(date)} />}
            <ActionRow>
              <AuthButton label="Cancelar" variant="secondary" onPress={close} />
              <AuthButton label="Aceptar" disabled={!valid || Platform.OS === 'web'} onPress={() => { onChange(draft); close(); }} />
            </ActionRow>
          </View></View>
        </Modal>)}
  </>;
}

const styles = StyleSheet.create({
  label: { color: Brand.textSecondary, fontSize: 14 },
  selected: { borderColor: Brand.cyan, backgroundColor: '#112C34' },
  title: { color: Brand.text, fontWeight: '800', fontSize: 21 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 22, backgroundColor: '#000A' },
  dialog: { padding: 16, gap: 12, borderRadius: 16, backgroundColor: Brand.surface, borderWidth: 1, borderColor: Brand.border },
});
