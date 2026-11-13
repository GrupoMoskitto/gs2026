import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { SessaoProvider, useSessao } from '@/hooks/SessaoContexto';
import { useEnvioDaFila } from '@/hooks/useConexao';
import { aplicarTema, lerPreferenciaTema } from '@/services/tema';
import { useTema } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { cores, escuro } = useTema();
  const { carregada } = useSessao();
  const [temaPronto, setTemaPronto] = useState(false);

  // Aplica o tema escolhido nos Ajustes antes de mostrar a primeira tela, para não piscar.
  useEffect(() => {
    let ativo = true;
    void lerPreferenciaTema().then((preferencia) => {
      aplicarTema(preferencia);
      if (ativo) setTemaPronto(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const pronto = carregada && temaPronto;

  useEffect(() => {
    if (pronto) void SplashScreen.hideAsync();
  }, [pronto]);

  useEnvioDaFila();

  if (!pronto) return null;

  const base = escuro ? DarkTheme : DefaultTheme;
  const tema = {
    ...base,
    colors: {
      ...base.colors,
      background: cores.fundo,
      card: cores.superficie,
      text: cores.texto,
      border: cores.linha,
      primary: cores.primaria,
    },
  };

  // Quem decide para onde ir é a rota raiz (index) e as guardas de identificacao e (tabs):
  // cada uma redireciona explicitamente conforme haja ou não identificação salva.
  return (
    <ThemeProvider value={tema}>
      <StatusBar style={escuro ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerTintColor: cores.primaria, contentStyle: { backgroundColor: cores.fundo } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="identificacao" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="relato/[id]" options={{ title: 'Relato', headerBackTitle: 'Voltar' }} />
        <Stack.Screen name="novo" options={{ title: 'Novo relato', presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function LayoutRaiz() {
  return (
    <SessaoProvider>
      <Navegacao />
    </SessaoProvider>
  );
}
