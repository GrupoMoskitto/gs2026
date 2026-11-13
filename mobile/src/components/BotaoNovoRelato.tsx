import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { ESPACO_ABAS } from '@/theme';
import { Botao } from './Botao';

export function BotaoNovoRelato() {
  return (
    <View style={estilos.caixa} pointerEvents="box-none">
      <View style={estilos.sombra}>
        <Botao rotulo="Novo relato" icone="add" aoPressionar={() => router.push('/novo')} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { position: 'absolute', right: 16, bottom: 16 + ESPACO_ABAS },
  sombra: Platform.select({
    ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
    default: { elevation: 6, borderRadius: 999 },
  }),
});
