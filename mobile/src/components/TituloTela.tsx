import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from './Texto';

interface Props {
  titulo: string;
  margem?: number;
}

/** Título dentro do conteúdo: o cabeçalho grande nativo é translúcido no iOS 26 e esconde o que fica embaixo. */
export function TituloTela({ titulo, margem = 16 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[estilos.caixa, { paddingTop: insets.top + 8, paddingHorizontal: margem }]}>
      <Texto variante="titulo" accessibilityRole="header">
        {titulo}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { paddingBottom: 4 },
});
