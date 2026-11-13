import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { AvisoFonte, Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { SeloRisco } from '@/components/Selos';
import { Superficie, useFundoCampo } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { TituloTela } from '@/components/TituloTela';
import { LUGARES, nomeDoLugar, ROTULO_TIPO_LOCAL, lugarDe } from '@/config/locais';
import { useConexao } from '@/hooks/useConexao';
import { useRecurso } from '@/hooks/useRecurso';
import { listarPrevisoes, piorBairro, riscoDe } from '@/services/previsoes';
import { alvoToque, coresDoRisco, ESPACO_ABAS, raio, useTema } from '@/theme';
import { FAIXAS_HORARIAS, type Bairro, type NivelRisco, type PrevisaoRisco } from '@/types/dominio';
import { buscarLocais } from '@/utils/busca';
import { ROTULO_FAIXA, ROTULO_FAIXA_FRASE, ROTULO_RISCO } from '@/utils/rotulos';
import { faixaAtual } from '@/utils/tempo';

const MAIORES = 8;

export default function TelaRisco() {
  const { cores } = useTema();
  const fundoCampo = useFundoCampo();
  const conectado = useConexao();
  const { estado, recarregando, recarregar } = useRecurso((sinal) => listarPrevisoes(undefined, { sinal }), []);
  const agora = useMemo(() => faixaAtual(), []);
  const [escolhido, setEscolhido] = useState<Bairro | null>(null);
  const [busca, setBusca] = useState('');

  const resultados = useMemo(() => buscarLocais(LUGARES, busca, 5), [busca]);

  if (estado.fase === 'carregando') return <Carregando rotulo="Carregando o risco…" />;
  if (estado.fase === 'erro') return <Erro mensagem={estado.mensagem} aoTentarDeNovo={recarregar} />;

  const previsoes = estado.resultado.dados;
  const pior = piorBairro(previsoes, agora);
  const maiores = [...previsoes.filter((p) => p.faixa_horaria === agora)].sort((a, b) => b.score - a.score).slice(0, MAIORES);
  const atual = escolhido ?? pior?.bairro ?? null;

  function escolher(codigo: Bairro) {
    setEscolhido(codigo);
    setBusca('');
  }

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={recarregando} onRefresh={recarregar} tintColor={cores.primaria} colors={[cores.primaria]} />}
      >
        <TituloTela titulo="Risco da região" margem={0} />
        <AvisoFonte fonte={estado.resultado.fonte} conectado={conectado} />

        {pior ? (
          <Superficie style={estilos.destaque} accessible accessibilityRole="summary">
            <Texto variante="legendaForte" suave>
              {`Agora, ${ROTULO_FAIXA_FRASE[agora]}`}
            </Texto>
            <Texto variante="subtitulo">{`Maior risco: ${nomeDoLugar(pior.bairro)}`}</Texto>
            <SeloRisco nivel={pior.nivel_risco} />
            <Texto variante="legenda" suave>
              {`Pontuação ${Math.round(pior.score * 100)} de 100, segundo o modelo.`}
            </Texto>
          </Superficie>
        ) : (
          <Texto suave>Ainda não há previsão para este horário.</Texto>
        )}

        {maiores.length > 0 ? (
          <View style={estilos.secao}>
            <Texto variante="subtitulo">Maiores riscos agora</Texto>
            <Superficie opaca style={estilos.lista}>
              {maiores.map((p) => (
                <LinhaLugar key={p.bairro} previsao={p} aoPressionar={() => escolher(p.bairro)} />
              ))}
            </Superficie>
          </View>
        ) : null}

        <View style={estilos.secao}>
          <Texto variante="subtitulo">Ver um local</Texto>
          <View style={[estilos.busca, { backgroundColor: fundoCampo, borderColor: cores.linha }]}>
            <Icone nome="search" tamanho={20} cor={cores.textoSuave} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar distrito ou município"
              placeholderTextColor={cores.textoSuave}
              returnKeyType="search"
              autoCorrect={false}
              accessibilityLabel="Buscar distrito ou município"
              style={[estilos.campoBusca, { color: cores.texto }]}
            />
            {busca !== '' ? (
              <Pressable onPress={() => setBusca('')} accessibilityRole="button" accessibilityLabel="Limpar a busca" hitSlop={8}>
                <Icone nome="close-circle" tamanho={20} cor={cores.textoSuave} />
              </Pressable>
            ) : null}
          </View>

          {busca.trim() !== '' ? (
            <Superficie opaca style={estilos.lista}>
              {resultados.length === 0 ? (
                <Texto suave style={estilos.vazio}>
                  Nenhum local com esse nome.
                </Texto>
              ) : (
                resultados.map((l) => (
                  <Pressable
                    key={l.slug}
                    onPress={() => escolher(l.slug)}
                    accessibilityRole="button"
                    accessibilityLabel={`${l.nome}. ${ROTULO_TIPO_LOCAL[l.tipo]}`}
                    style={estilos.linha}
                  >
                    <View style={estilos.linhaTexto}>
                      <Texto variante="corpoForte" numberOfLines={1}>
                        {l.nome}
                      </Texto>
                      <Texto variante="legenda" suave numberOfLines={1}>
                        {ROTULO_TIPO_LOCAL[l.tipo]}
                      </Texto>
                    </View>
                  </Pressable>
                ))
              )}
            </Superficie>
          ) : null}

          {atual ? (
            <View style={estilos.secao}>
              <Texto variante="corpoForte" accessibilityRole="header">
                {nomeDoLugar(atual)}
              </Texto>
              <Texto variante="legenda" suave>
                {lugarDe(atual) ? ROTULO_TIPO_LOCAL[lugarDe(atual)!.tipo] : ''}
              </Texto>
              <View style={estilos.celulas}>
                {FAIXAS_HORARIAS.map((f) => {
                  const p = riscoDe(previsoes, atual, f);
                  return (
                    <View key={f} style={estilos.coluna}>
                      <Texto variante="legendaForte" suave numberOfLines={1} adjustsFontSizeToFit>
                        {ROTULO_FAIXA[f]}
                      </Texto>
                      <CelulaRisco nivel={p?.nivel_risco ?? null} score={p?.score ?? null} agora={f === agora} rotulo={`${nomeDoLugar(atual)}, ${ROTULO_FAIXA[f].toLowerCase()}`} />
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>

        <Texto variante="legenda" suave style={estilos.nota}>
          Previsão feita por um modelo de aprendizado de máquina com dados simulados. Serve para apoiar a decisão, não para garantir segurança.
        </Texto>
      </ScrollView>
    </View>
  );
}

function LinhaLugar({ previsao, aoPressionar }: { previsao: PrevisaoRisco; aoPressionar: () => void }) {
  const lugar = lugarDe(previsao.bairro);
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`${nomeDoLugar(previsao.bairro)}, risco ${ROTULO_RISCO[previsao.nivel_risco].toLowerCase()}`}
      style={estilos.linha}
    >
      <View style={estilos.linhaTexto}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {nomeDoLugar(previsao.bairro)}
        </Texto>
        <Texto variante="legenda" suave numberOfLines={1}>
          {lugar ? ROTULO_TIPO_LOCAL[lugar.tipo] : ''}
        </Texto>
      </View>
      <SeloRisco nivel={previsao.nivel_risco} />
    </Pressable>
  );
}

function CelulaRisco({ nivel, score, agora, rotulo }: { nivel: NivelRisco | null; score: number | null; agora: boolean; rotulo: string }) {
  const { cores } = useTema();
  const c = nivel ? coresDoRisco(cores, nivel) : null;
  return (
    <View
      accessible
      accessibilityLabel={nivel ? `${rotulo}: risco ${ROTULO_RISCO[nivel].toLowerCase()}` : `${rotulo}: sem dados`}
      style={[
        estilos.celula,
        { backgroundColor: c?.suave ?? cores.superficie2 },
        agora ? { borderWidth: 2, borderColor: cores.primaria } : null,
      ]}
    >
      <Texto variante="legendaForte" cor={c?.sobre ?? cores.textoSuave} numberOfLines={1} adjustsFontSizeToFit>
        {nivel ? ROTULO_RISCO[nivel] : '–'}
      </Texto>
      {score !== null ? (
        <Texto variante="legenda" cor={c?.sobre ?? cores.textoSuave}>
          {score.toFixed(2).replace('.', ',')}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: 16, gap: 20, paddingBottom: 32 + ESPACO_ABAS },
  destaque: { padding: 16, gap: 8 },
  secao: { gap: 10 },
  lista: { paddingVertical: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 },
  linhaTexto: { flex: 1 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, minHeight: alvoToque, borderRadius: raio.pilula, borderWidth: StyleSheet.hairlineWidth },
  campoBusca: { flex: 1, fontSize: 17, minHeight: alvoToque },
  vazio: { padding: 16 },
  celulas: { flexDirection: 'row', gap: 6 },
  coluna: { flex: 1, alignItems: 'center', gap: 6 },
  celula: {
    alignSelf: 'stretch',
    minHeight: 56,
    borderRadius: raio.sm,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  nota: { marginTop: 4 },
});
