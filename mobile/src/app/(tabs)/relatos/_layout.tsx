import { Stack } from 'expo-router';

import { useOpcoesCabecalho } from '@/components/cabecalho';

export default function RelatosLayout() {
  const opcoes = useOpcoesCabecalho('Relatos', false);
  return (
    <Stack screenOptions={{ ...opcoes, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
