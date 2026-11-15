import { Children, cloneElement, isValidElement, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';

// Acciones pareadas: mismo alto y 8 pt de separación. Cada botón ocupa lo que pide su texto
// y el espacio sobrante se reparte, así que la etiqueta más larga queda con más ancho.
// Si no caben en una fila, se apilan a ancho completo.
export function ActionRow({ children }: { children: ReactElement | (ReactElement | false | null)[] }) {
  return (
    <View style={styles.row}>
      {Children.toArray(children).map((child) =>
        isValidElement<{ style?: object }>(child)
          ? cloneElement(child, { style: [styles.item, child.props.style] as unknown as object })
          : child,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  item: { flexGrow: 1, flexShrink: 0 },
});
