import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { raio, useTema } from '@/theme';
import { TIPOS_RELATO, type TipoRelato } from '@/types/dominio';
import { ROTULO_TIPO } from '@/utils/rotulos';
import { Botao } from './Botao';
import { Chip } from './Chip';
import { Texto } from './Texto';

interface Props {
  visivel: boolean;
  aoFechar: () => void;
  tipos: readonly TipoRelato[];
  aoMudarTipos: (tipos: TipoRelato[]) => void;
  total: number;
}

function alternar<T>(lista: readonly T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

export function FolhaFiltros({ visivel, aoFechar, tipos, aoMudarTipos, total }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const ativos = tipos.length;
  const ios = Platform.OS === 'ios';

  const conteudo = (
    <View style={[estilos.folha, { backgroundColor: cores.fundo, paddingBottom: ios ? 16 : insets.bottom + 16 }, ios ? estilos.folhaIos : estilos.folhaAndroid]}>
      <View style={estilos.cabecalho}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Filtros
        </Texto>
        <Botao
          rotulo="Limpar"
          variante="texto"
          desativado={ativos === 0}
          aoPressionar={() => aoMudarTipos([])}
        />
      </View>

      <View style={estilos.grupo}>
        <Texto variante="legendaForte" suave>
          Tipo de roubo
        </Texto>
        <View style={estilos.chips}>
          {TIPOS_RELATO.map((t) => (
            <Chip key={t} papel="checkbox" rotulo={ROTULO_TIPO[t]} selecionado={tipos.includes(t)} aoPressionar={() => aoMudarTipos(alternar(tipos, t))} />
          ))}
        </View>
      </View>

      <Texto variante="legenda" suave>
        Sem nada marcado, o mapa mostra todos os tipos.
      </Texto>

      <View style={estilos.rodape}>
        <Botao rotulo={total === 1 ? 'Ver 1 relato' : `Ver ${total} relatos`} aoPressionar={aoFechar} />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visivel}
      animationType="slide"
      presentationStyle={ios ? 'pageSheet' : undefined}
      transparent={!ios}
      onRequestClose={aoFechar}
    >
      {ios ? (
        conteudo
      ) : (
        <View style={estilos.fundoAndroid}>
          <Pressable style={StyleSheet.absoluteFill} onPress={aoFechar} accessibilityLabel="Fechar filtros" accessibilityRole="button" />
          {conteudo}
        </View>
      )}
    </Modal>
  );
}

const estilos = StyleSheet.create({
  folha: { padding: 20, gap: 24 },
  folhaIos: { flex: 1 },
  folhaAndroid: { borderTopLeftRadius: raio.xl, borderTopRightRadius: raio.xl },
  fundoAndroid: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grupo: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rodape: { marginTop: 'auto' },
});
