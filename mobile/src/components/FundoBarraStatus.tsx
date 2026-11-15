import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTema } from '@/theme';

/** Faixa com a cor do fundo atrás da barra de status, para o conteúdo rolado não passar por baixo do relógio. */
export function FundoBarraStatus() {
  const { cores } = useTema();
  const { top } = useSafeAreaInsets();
  return <View pointerEvents="none" style={[estilos.faixa, { height: top, backgroundColor: cores.fundo }]} />;
}

const estilos = StyleSheet.create({
  faixa: { position: 'absolute', top: 0, left: 0, right: 0 },
});
