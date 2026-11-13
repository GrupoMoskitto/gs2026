import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { alvoToque, raio, useTema } from '@/theme';
import { Icone, type NomeIcone } from './Icone';
import { useVidro } from './Superficie';
import { Texto } from './Texto';

type Variante = 'primario' | 'secundario' | 'texto';

interface Props {
  rotulo: string;
  aoPressionar: () => void;
  variante?: Variante;
  icone?: NomeIcone;
  carregando?: boolean;
  desativado?: boolean;
  descricaoAcessivel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Botao({
  rotulo,
  aoPressionar,
  variante = 'primario',
  icone,
  carregando = false,
  desativado = false,
  descricaoAcessivel,
  style,
}: Props) {
  const { cores } = useTema();
  const vidro = useVidro() && variante !== 'texto';
  const bloqueado = desativado || carregando;

  const fundo = vidro
    ? 'transparent'
    : variante === 'primario'
      ? cores.primaria
      : variante === 'secundario'
        ? cores.primariaSuave
        : 'transparent';
  const corTexto =
    variante === 'primario' ? cores.sobrePrimaria : variante === 'secundario' ? cores.sobrePrimariaSuave : cores.primaria;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={descricaoAcessivel ?? rotulo}
      accessibilityState={{ disabled: bloqueado, busy: carregando }}
      disabled={bloqueado}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        aoPressionar();
      }}
      android_ripple={{ color: `${corTexto}33`, borderless: false }}
      style={({ pressed }) => [
        estilos.base,
        { backgroundColor: fundo },
        pressed && Platform.OS === 'ios' ? estilos.pressionado : null,
        bloqueado ? estilos.desativado : null,
        style,
      ]}
    >
      {vidro ? (
        <GlassView
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          glassEffectStyle="regular"
          isInteractive
          tintColor={variante === 'primario' ? cores.primaria : undefined}
        />
      ) : null}
      <View style={estilos.conteudo}>
        {carregando ? (
          <ActivityIndicator color={corTexto} />
        ) : icone ? (
          <Icone nome={icone} tamanho={20} cor={corTexto} />
        ) : null}
        <Texto variante="corpoForte" cor={corTexto}>
          {rotulo}
        </Texto>
      </View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  base: {
    minHeight: alvoToque + 4,
    paddingHorizontal: 20,
    borderRadius: raio.pilula,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  conteudo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressionado: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  desativado: { opacity: 0.5 },
});
