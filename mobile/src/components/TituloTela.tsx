import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Texto } from './Texto';

interface Props {
  titulo: string;
  /** Margem lateral. Use 0 quando a tela já tem a sua própria */
  margem?: number;
}

/**
 * Título da tela dentro do conteúdo, logo abaixo da barra de status.
 * Substitui o título grande do cabeçalho nativo, que no iOS 26 é translúcido, deixa um vazio grande
 * no topo e esconde o que fica embaixo dele.
 */
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
