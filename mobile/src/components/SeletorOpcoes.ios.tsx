// Seletor de opções nativo no iOS: o Picker do SwiftUI (segmentado ou menu), pelo @expo/ui.
// Substitui os grupos de chips desenhados à mão. O Android usa SeletorOpcoes.tsx (Jetpack Compose).
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

import { useTema } from '@/theme';
import type { PropsSeletor } from './SeletorOpcoes.tipos';

export type { Opcao, PropsSeletor } from './SeletorOpcoes.tipos';

// Valor reservado para "nada escolhido": o Picker precisa de uma opção para mostrar enquanto valor é null.
const VAZIO = '__vazio__';

export function SeletorOpcoes<T extends string>({ opcoes, valor, aoMudar, rotulo, estilo = 'segmentado', textoVazio = 'Escolher' }: PropsSeletor<T>) {
  const { cores, escuro } = useTema();
  const menu = estilo === 'menu';

  return (
    <Host
      matchContents={{ vertical: true }}
      style={estilos.host}
      colorScheme={escuro ? 'dark' : 'light'}
      seedColor={cores.primaria}
    >
      <Picker
        label={rotulo}
        selection={valor ?? VAZIO}
        onSelectionChange={(escolhido) => {
          const opcao = opcoes.find((o) => o.id === escolhido);
          if (opcao) aoMudar(opcao.id);
        }}
        modifiers={[pickerStyle(menu ? 'menu' : 'segmented')]}
      >
        {valor === null && menu ? <Text modifiers={[tag(VAZIO)]}>{textoVazio}</Text> : null}
        {opcoes.map((o) => (
          <Text key={o.id} modifiers={[tag(o.id)]}>
            {o.rotulo}
          </Text>
        ))}
      </Picker>
    </Host>
  );
}

const estilos = StyleSheet.create({
  host: { width: '100%' },
});
