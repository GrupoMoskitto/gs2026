import { Modal, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { raio, useTema } from '@/theme';
import { FAIXAS_HORARIAS, ORIGENS, STATUS_RELATO, TIPOS_RELATO } from '@/types/dominio';
import { contarFiltros, PERIODOS, SEM_FILTROS, type FiltrosRelatos } from '@/utils/filtros';
import { HORAS_FAIXA, ROTULO_FAIXA, ROTULO_ORIGEM, ROTULO_STATUS, ROTULO_TIPO } from '@/utils/rotulos';
import { Botao } from './Botao';
import { Chip } from './Chip';
import { Texto } from './Texto';

export type SecaoFiltro = 'tipo' | 'status' | 'periodo' | 'faixa' | 'origem';

interface Props {
  visivel: boolean;
  aoFechar: () => void;
  filtros: FiltrosRelatos;
  aoMudar: (filtros: FiltrosRelatos) => void;
  secoes: readonly SecaoFiltro[];
  total: number;
  aviso: string;
}

function alternar<T>(lista: readonly T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item];
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={estilos.grupo}>
      <Texto variante="legendaForte" suave accessibilityRole="header">
        {titulo}
      </Texto>
      <View style={estilos.chips}>{children}</View>
    </View>
  );
}

export function FolhaFiltros({ visivel, aoFechar, filtros, aoMudar, secoes, total, aviso }: Props) {
  const { cores } = useTema();
  const insets = useSafeAreaInsets();
  const ios = Platform.OS === 'ios';
  const mudar = (parcial: Partial<FiltrosRelatos>) => aoMudar({ ...filtros, ...parcial });

  const conteudo = (
    <View style={[estilos.folha, { backgroundColor: cores.fundo, paddingBottom: ios ? 16 : insets.bottom + 16 }, ios ? estilos.folhaIos : estilos.folhaAndroid]}>
      <View style={estilos.cabecalho}>
        <Texto variante="subtitulo" accessibilityRole="header">
          Filtros
        </Texto>
        <Botao rotulo="Limpar" variante="texto" desativado={contarFiltros(filtros) === 0} aoPressionar={() => aoMudar(SEM_FILTROS)} />
      </View>

      <ScrollView style={ios ? estilos.rolagemIos : estilos.rolagem} contentContainerStyle={estilos.secoes}>
        {secoes.includes('tipo') ? (
          <Grupo titulo="Tipo de roubo">
            {TIPOS_RELATO.map((t) => (
              <Chip key={t} papel="checkbox" rotulo={ROTULO_TIPO[t]} selecionado={filtros.tipos.includes(t)} aoPressionar={() => mudar({ tipos: alternar(filtros.tipos, t) })} />
            ))}
          </Grupo>
        ) : null}

        {secoes.includes('status') ? (
          <Grupo titulo="Situação">
            {STATUS_RELATO.map((s) => (
              <Chip key={s} papel="checkbox" rotulo={ROTULO_STATUS[s]} selecionado={filtros.status.includes(s)} aoPressionar={() => mudar({ status: alternar(filtros.status, s) })} />
            ))}
          </Grupo>
        ) : null}

        {secoes.includes('periodo') ? (
          <Grupo titulo="Quando aconteceu">
            {PERIODOS.map((p) => (
              <Chip key={p.id} rotulo={p.rotulo} selecionado={filtros.periodo === p.id} aoPressionar={() => mudar({ periodo: p.id })} />
            ))}
          </Grupo>
        ) : null}

        {secoes.includes('faixa') ? (
          <Grupo titulo="Faixa do dia">
            {FAIXAS_HORARIAS.map((f) => (
              <Chip
                key={f}
                papel="checkbox"
                rotulo={`${ROTULO_FAIXA[f]} (${HORAS_FAIXA[f]})`}
                selecionado={filtros.faixas.includes(f)}
                aoPressionar={() => mudar({ faixas: alternar(filtros.faixas, f) })}
              />
            ))}
          </Grupo>
        ) : null}

        {secoes.includes('origem') ? (
          <Grupo titulo="Enviado por">
            {ORIGENS.map((o) => (
              <Chip key={o} papel="checkbox" rotulo={ROTULO_ORIGEM[o]} selecionado={filtros.origens.includes(o)} aoPressionar={() => mudar({ origens: alternar(filtros.origens, o) })} />
            ))}
          </Grupo>
        ) : null}

        <Texto variante="legenda" suave>
          {aviso}
        </Texto>
      </ScrollView>

      <Botao rotulo={total === 1 ? 'Ver 1 relato' : `Ver ${total} relatos`} aoPressionar={aoFechar} />
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
  folha: { padding: 20, gap: 16 },
  folhaIos: { flex: 1 },
  folhaAndroid: { maxHeight: '85%', borderTopLeftRadius: raio.xl, borderTopRightRadius: raio.xl },
  fundoAndroid: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rolagem: { flexGrow: 0, flexShrink: 1 },
  rolagemIos: { flex: 1 },
  secoes: { gap: 24, paddingBottom: 8 },
  grupo: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
