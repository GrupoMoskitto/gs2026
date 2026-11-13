// Opções do cabeçalho nativo. No iOS, título grande que encolhe ao rolar; no Android, barra do Material.
import type { Stack } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform } from 'react-native';

import { useTema } from '@/theme';

type OpcoesPilha = NonNullable<ComponentProps<typeof Stack>['screenOptions']>;
type Opcoes = Extract<OpcoesPilha, object>;

export function useOpcoesCabecalho(titulo: string, tituloGrande = true): Opcoes {
  const { cores } = useTema();
  return {
    title: titulo,
    headerLargeTitle: Platform.OS === 'ios' && tituloGrande,
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerTintColor: cores.primaria,
    headerTitleStyle: { color: cores.texto },
    headerLargeTitleStyle: { color: cores.texto },
    headerStyle: { backgroundColor: Platform.OS === 'android' ? cores.superficie : cores.fundo },
    contentStyle: { backgroundColor: cores.fundo },
  };
}
