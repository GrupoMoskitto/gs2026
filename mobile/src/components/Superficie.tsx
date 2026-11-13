// Superfície base (cartão, barra, pílula). No iOS 26 vira vidro líquido nativo; no resto, um fundo sólido.
// Plano B: iOS anterior ao 26, Android e "Reduzir transparência" ligado usam o visual sólido.
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { raio, useTema } from '@/theme';

// As duas checagens: o sistema é iOS 26+ e a API de vidro existe neste build (Expo Go incluso).
const VIDRO_DISPONIVEL = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** Vidro só quando o aparelho suporta e a pessoa não pediu para reduzir a transparência. */
export function useVidro(): boolean {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let ativo = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((v) => {
      if (ativo) setReduzir(v);
    });
    const assinatura = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setReduzir);
    return () => {
      ativo = false;
      assinatura.remove();
    };
  }, []);
  return VIDRO_DISPONIVEL && !reduzir;
}

/** Fundo de campo de texto: translúcido sobre vidro, sólido do tema nos outros casos. */
export function useFundoCampo(): string {
  const { cores, escuro } = useTema();
  const vidro = useVidro();
  if (!vidro) return cores.superficie2;
  return escuro ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)';
}

type Variante = 'cartao' | 'barra' | 'pilula';

const RAIO: Record<Variante, number> = { cartao: raio.lg, barra: raio.xl, pilula: raio.pilula };

interface Props extends ViewProps {
  variante?: Variante;
  /** Cor que tinge o vidro (iOS 26). Use uma cor com transparência, por exemplo "#FBEBC2B3" */
  tinta?: string;
  /** Fundo sólido usado quando não há vidro. Padrão: superfície do tema */
  fundoSolido?: string;
  /** Sempre opaca, mesmo no iOS 26. Para itens de lista, que não flutuam sobre nada. */
  opaca?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Superficie({ variante = 'cartao', tinta, fundoSolido, opaca = false, style, children, ...resto }: Props) {
  const { cores, escuro } = useTema();
  const vidro = useVidro();
  const forma = { borderRadius: RAIO[variante], borderCurve: 'continuous' as const };

  if (vidro && !opaca) {
    return (
      <GlassView
        glassEffectStyle="regular"
        tintColor={tinta ?? (escuro ? 'rgba(10, 18, 30, 0.55)' : undefined)}
        style={[estilos.vidro, forma, { borderColor: cores.vidroLinha }, style]}
        {...resto}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        estilos.solido,
        forma,
        {
          backgroundColor: fundoSolido ?? cores.superficie,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: cores.linha,
        },
        variante === 'cartao' && Platform.OS === 'android' ? { elevation: 1 } : null,
        style,
      ]}
      {...resto}
    >
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  vidro: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  solido: { overflow: 'hidden' },
});
