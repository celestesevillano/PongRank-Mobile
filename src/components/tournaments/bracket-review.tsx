import { GitFork, Send, Users } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthButton } from '@/components/auth/auth-button';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Brand, Spacing } from '@/constants/theme';
import { BracketDiagram } from './bracket-diagram';
import { buildBracket, validateParticipantCount, type Entrant } from './bracket-model';

export function BracketReview({ entrants, onPublish }: {
  entrants: readonly Entrant[];
  onPublish?: () => void;
}) {
  const bracket = useMemo(() => buildBracket(entrants), [entrants]);
  const validationMessage = validateParticipantCount(entrants.length);
  const [showNotice, setShowNotice] = useState(!bracket);
  const closeNotice = () => setShowNotice(false);

  function publish() {
    if (!bracket || !onPublish) {
      setShowNotice(true);
      return;
    }
    onPublish();
  }

  const round = bracket?.rounds[0].title.toLowerCase();
  const summary = bracket?.preliminary.length
    ? `${entrants.length} jugadores: ${bracket.preliminary.length} ganadores de preliminar + ${bracket.directCount} pases directos = ${bracket.principal} en ${round}`
    : `${entrants.length} jugadores · ${round}`;

  return (
    <View style={styles.layout}>
      <View style={styles.body}>
        {bracket ? (
          <>
            <Text style={styles.copy}>{summary}</Text>
            <BracketDiagram bracket={bracket} />
          </>
        ) : <Text style={styles.copy}>{validationMessage}.</Text>}
      </View>
      <View style={styles.footer}>
        <AuthButton label="Publicar torneo" icon={Send} disabled={!bracket} onPress={publish} />
      </View>
      <ConfirmDialog busy={false} onCancel={closeNotice} confirmation={showNotice ? {
        title: bracket ? 'Vista de revisión' : validationMessage ?? 'Revisa los participantes',
        message: bracket
          ? 'La publicación por eliminación directa aún no está disponible.'
          : 'Ajusta la selección para generar la llave.',
        label: 'Aceptar',
        Icon: bracket ? GitFork : Users,
        infoOnly: true,
        onConfirm: closeNotice,
      } : null} />
    </View>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, gap: Spacing.two, minHeight: 0 },
  copy: { color: Brand.textSecondary, fontSize: 14, lineHeight: 20 },
  body: { flex: 1, gap: Spacing.two, minHeight: 0 },
  footer: { paddingBottom: Spacing.three, paddingTop: 4 },
});
