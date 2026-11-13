import { Stack } from 'expo-router';

import { useOpcoesCabecalho } from '@/components/cabecalho';

export default function MapaLayout() {
  const opcoes = useOpcoesCabecalho('Mapa', false);
  return (
    <Stack screenOptions={{ ...opcoes, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
