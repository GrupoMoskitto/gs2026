import { Text, type TextProps } from 'react-native';

import { tipografia, useTema } from '@/theme';

export type VarianteTexto = keyof typeof tipografia;

interface Props extends TextProps {
  variante?: VarianteTexto;
  /** Usa a cor de texto suave (apoio) em vez da cor principal */
  suave?: boolean;
  cor?: string;
}

/** Texto padrão do app: acompanha o tema e o tamanho de fonte do sistema. */
export function Texto({ variante = 'corpo', suave = false, cor, style, ...resto }: Props) {
  const { cores } = useTema();
  return <Text {...resto} style={[tipografia[variante], { color: cor ?? (suave ? cores.textoSuave : cores.texto) }, style]} />;
}
