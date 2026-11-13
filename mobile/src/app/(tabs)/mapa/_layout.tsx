import { Stack } from 'expo-router';

import { useOpcoesCabecalho } from '@/components/cabecalho';

export default function MapaLayout() {
  const opcoes = useOpcoesCabecalho('Mapa', false);
  // O mapa ocupa a tela inteira: a aba já diz "Mapa", então não há cabeçalho.
  return (
    <Stack screenOptions={{ ...opcoes, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
