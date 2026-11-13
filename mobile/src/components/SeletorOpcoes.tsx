// Seletor de opções nativo no Android: Material 3 em Jetpack Compose, pelo @expo/ui
// (botões segmentados ou menu suspenso). O iOS usa SeletorOpcoes.ios.tsx (Picker do SwiftUI).
// Este arquivo é o padrão para qualquer plataforma que não seja iOS.
import { DropdownMenu, DropdownMenuItem, Host, OutlinedButton, SegmentedButton, SingleChoiceSegmentedButtonRow, Text } from '@expo/ui/jetpack-compose';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useTema } from '@/theme';
import type { PropsSeletor } from './SeletorOpcoes.tipos';

export type { Opcao, PropsSeletor } from './SeletorOpcoes.tipos';

export function SeletorOpcoes<T extends string>({ opcoes, valor, aoMudar, rotulo, estilo = 'segmentado', textoVazio = 'Escolher' }: PropsSeletor<T>) {
  const { cores, escuro } = useTema();
  const [aberto, setAberto] = useState(false);
  const atual = opcoes.find((o) => o.id === valor);

  return (
    <Host
      matchContents={{ vertical: true }}
      style={estilos.host}
      colorScheme={escuro ? 'dark' : 'light'}
      seedColor={cores.primaria}
    >
      {estilo === 'segmentado' ? (
        <SingleChoiceSegmentedButtonRow>
          {opcoes.map((o) => (
            <SegmentedButton key={o.id} selected={o.id === valor} onClick={() => aoMudar(o.id)}>
              <SegmentedButton.Label>
                <Text>{o.rotulo}</Text>
              </SegmentedButton.Label>
            </SegmentedButton>
          ))}
        </SingleChoiceSegmentedButtonRow>
      ) : (
        <DropdownMenu expanded={aberto} onDismissRequest={() => setAberto(false)}>
          <DropdownMenu.Trigger>
            <OutlinedButton onClick={() => setAberto(true)}>
              <Text>{atual ? atual.rotulo : textoVazio}</Text>
            </OutlinedButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {opcoes.map((o) => (
              <DropdownMenuItem
                key={o.id}
                onClick={() => {
                  setAberto(false);
                  aoMudar(o.id);
                }}
              >
                <DropdownMenuItem.Text>
                  <Text>{o.rotulo}</Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      )}
    </Host>
  );
}

const estilos = StyleSheet.create({
  host: { width: '100%' },
});
