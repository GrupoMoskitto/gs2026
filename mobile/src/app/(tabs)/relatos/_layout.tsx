import { Stack } from 'expo-router';

import { useOpcoesCabecalho } from '@/components/cabecalho';

export default function RelatosLayout() {
  const opcoes = useOpcoesCabecalho('Relatos', false);
  // O título fica dentro da tela (TituloTela): o cabeçalho nativo translúcido escondia o conteúdo.
  return (
    <Stack screenOptions={{ ...opcoes, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
