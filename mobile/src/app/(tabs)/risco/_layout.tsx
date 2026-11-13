import { Stack } from 'expo-router';

import { useOpcoesCabecalho } from '@/components/cabecalho';

export default function RiscoLayout() {
  const opcoes = useOpcoesCabecalho('Risco da região', false);
  return (
    <Stack screenOptions={{ ...opcoes, headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
