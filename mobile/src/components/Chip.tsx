import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { alvoToque, raio, useTema } from '@/theme';
import { Icone, type NomeIcone } from './Icone';
import { useVidro } from './Superficie';
import { Texto } from './Texto';

interface Props {
  rotulo: string;
  selecionado: boolean;
  aoPressionar: () => void;
  icone?: NomeIcone;
  papel?: 'radio' | 'checkbox';
}

export function Chip({ rotulo, selecionado, aoPressionar, icone, papel = 'radio' }: Props) {
  const { cores } = useTema();
  const vidro = useVidro();
  const corTexto = selecionado ? cores.fundo : cores.texto;
  return (
    <Pressable
      accessibilityRole={papel}
      accessibilityState={papel === 'checkbox' ? { checked: selecionado } : { selected: selecionado }}
      accessibilityLabel={rotulo}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        aoPressionar();
      }}
      android_ripple={{ color: `${cores.primaria}22` }}
      style={[
        estilos.base,
        {
          backgroundColor: vidro ? 'transparent' : selecionado ? cores.texto : cores.superficie,
          borderColor: selecionado ? cores.texto : cores.linha,
          borderWidth: vidro ? StyleSheet.hairlineWidth : 1,
        },
      ]}
    >
      {vidro ? (
        <GlassView
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, estilos.vidro]}
          glassEffectStyle="regular"
          isInteractive
          tintColor={selecionado ? `${cores.texto}E6` : undefined}
        />
      ) : null}
      {icone ? <Icone nome={icone} tamanho={18} cor={corTexto} /> : null}
      {/* Mesmo peso nos dois estados: negrito é mais largo e o chip crescia ao ser selecionado. */}
      <Texto variante="corpo" cor={corTexto}>
        {rotulo}
      </Texto>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: alvoToque,
    paddingHorizontal: 14,
    borderRadius: raio.pilula,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  // O vidro do iOS 26 não herda o arredondamento do Pressable: sem raio próprio, aparece quadrado ao tocar.
  vidro: { borderRadius: alvoToque / 2 },
});
