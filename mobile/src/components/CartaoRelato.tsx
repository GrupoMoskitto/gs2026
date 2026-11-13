import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { nomeDoLugar } from '@/config/locais';
import { raio, useTema } from '@/theme';
import type { Relato } from '@/types/dominio';
import { ROTULO_TIPO } from '@/utils/rotulos';
import { formatarQuando } from '@/utils/tempo';
import { Icone, type NomeIcone } from './Icone';
import { SeloStatus } from './Selos';
import { Superficie } from './Superficie';
import { Texto } from './Texto';

const ICONE_TIPO: Record<Relato['tipo'], NomeIcone> = {
  celular: 'phone-portrait-outline',
  bolsa_mochila: 'bag-handle-outline',
  veiculo: 'car-outline',
  bicicleta: 'bicycle-outline',
  comercio: 'storefront-outline',
  outro: 'ellipsis-horizontal-circle-outline',
};

export function iconeDoTipo(tipo: Relato['tipo']): NomeIcone {
  return ICONE_TIPO[tipo];
}

interface Props {
  relato: Relato;
  aoPressionar: () => void;
  flutuante?: boolean;
}

export function CartaoRelato({ relato, aoPressionar, flutuante = false }: Props) {
  const { cores } = useTema();
  const titulo = `${ROTULO_TIPO[relato.tipo]}, ${nomeDoLugar(relato.bairro)}`;
  const quando = formatarQuando(relato.ocorrido_em);
  return (
    <Superficie opaca={!flutuante}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${quando}. Status: ${relato.status}`}
        onPress={aoPressionar}
        android_ripple={{ color: `${cores.primaria}22` }}
        style={({ pressed }) => [estilos.cartao, pressed && Platform.OS === 'ios' ? { opacity: 0.8 } : null]}
      >
        <View style={[estilos.icone, { backgroundColor: cores.primariaSuave }]}>
          <Icone nome={iconeDoTipo(relato.tipo)} tamanho={22} cor={cores.sobrePrimariaSuave} />
        </View>
        <View style={estilos.corpo}>
          <View style={estilos.linha}>
            <Texto variante="corpoForte" numberOfLines={1} style={estilos.titulo}>
              {titulo}
            </Texto>
            <SeloStatus status={relato.status} />
          </View>
          {relato.descricao ? (
            <Texto numberOfLines={2} suave>
              {relato.descricao}
            </Texto>
          ) : null}
          <Texto variante="legenda" suave>
            {quando}
          </Texto>
        </View>
      </Pressable>
    </Superficie>
  );
}

const estilos = StyleSheet.create({
  cartao: { flexDirection: 'row', gap: 12, padding: 14, minHeight: 72 },
  icone: { width: 44, height: 44, borderRadius: raio.md, alignItems: 'center', justifyContent: 'center' },
  corpo: { flex: 1, gap: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titulo: { flex: 1 },
});
