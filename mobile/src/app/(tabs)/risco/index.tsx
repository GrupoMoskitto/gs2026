import { useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, type ScrollViewInstance } from 'react-native';

import { Chip } from '@/components/Chip';
import { AvisoFonte, Carregando, Erro } from '@/components/Estados';
import { FundoBarraStatus } from '@/components/FundoBarraStatus';
import { BarraDivisao, BarraNiveis, BarrasHorizontais, GraficoHoras } from '@/components/GraficosRisco';
import { Icone } from '@/components/Icone';
import { SeloRisco } from '@/components/Selos';
import { Superficie, useFundoCampo } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { TituloTela } from '@/components/TituloTela';
import { LUGARES, nomeDoLugar, ROTULO_TIPO_CURTO, ROTULO_TIPO_LOCAL, lugarDe } from '@/config/locais';
import { useConexao } from '@/hooks/useConexao';
import { useRecurso } from '@/hooks/useRecurso';
import { resumoDoModelo, taxaNaFaixa, type ResumoLugar } from '@/services/modelo';
import { listarPrevisoes, riscoDe } from '@/services/previsoes';
import { alvoToque, coresDoRisco, ESPACO_ABAS, raio, useTema } from '@/theme';
import { FAIXAS_HORARIAS, type Bairro, type FaixaHoraria, type NivelRisco, type PrevisaoRisco } from '@/types/dominio';
import { buscarLocais } from '@/utils/busca';
import { formatarDecimal, formatarInteiro, formatarParte, mesCurto, mesPorExtenso } from '@/utils/numeros';
import { contarNiveis, extremos, horaDePico, maioresRiscos } from '@/utils/risco';
import { HORAS_FAIXA, ROTULO_FAIXA, ROTULO_FAIXA_FRASE, ROTULO_RISCO } from '@/utils/rotulos';
import { faixaAtual } from '@/utils/tempo';

const MAIORES = 8;
const RESUMO = resumoDoModelo();

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function TelaRisco() {
  const { cores } = useTema();
  const fundoCampo = useFundoCampo();
  const conectado = useConexao();
  const { estado, recarregando, recarregar } = useRecurso((sinal) => listarPrevisoes(undefined, { sinal }), []);
  const agora = useMemo(() => faixaAtual(), []);
  const [faixa, setFaixa] = useState<FaixaHoraria>(agora);
  const [escolhido, setEscolhido] = useState<Bairro | null>(null);
  const [busca, setBusca] = useState('');
  const rolagem = useRef<ScrollViewInstance>(null);
  const posicaoLugar = useRef(0);

  const resultados = useMemo(() => buscarLocais(LUGARES, busca, 5), [busca]);

  if (estado.fase === 'carregando') return <Carregando rotulo="Carregando o risco…" />;
  if (estado.fase === 'erro') return <Erro mensagem={estado.mensagem} aoTentarDeNovo={recarregar} />;

  const previsoes = estado.resultado.dados;
  const maiores = maioresRiscos(previsoes, faixa, MAIORES, (b) => taxaNaFaixa(b, faixa));
  const pior = maiores[0] ?? null;
  const atual = escolhido ?? pior?.bairro ?? null;
  const quando = faixa === agora ? `Agora, ${ROTULO_FAIXA_FRASE[faixa]}` : maiuscula(ROTULO_FAIXA_FRASE[faixa]);

  function escolher(codigo: Bairro, rolar: boolean) {
    setEscolhido(codigo);
    setBusca('');
    if (rolar) rolagem.current?.scrollTo({ y: posicaoLugar.current - 8, animated: true });
  }

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView
        ref={rolagem}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={recarregando} onRefresh={recarregar} tintColor={cores.primaria} colors={[cores.primaria]} />}
      >
        <TituloTela titulo="Risco da região" margem={0} />
        <AvisoFonte fonte={estado.resultado.fonte} conectado={conectado} />

        <View style={estilos.chips} accessibilityRole="radiogroup" accessibilityLabel="Faixa do dia">
          {FAIXAS_HORARIAS.map((f) => (
            <Chip key={f} rotulo={ROTULO_FAIXA[f]} selecionado={faixa === f} aoPressionar={() => setFaixa(f)} />
          ))}
        </View>

        {pior ? (
          <Superficie style={estilos.destaque} accessible accessibilityRole="summary">
            <Texto variante="legendaForte" suave>
              {`${quando} (${HORAS_FAIXA[faixa]})`}
            </Texto>
            <Texto variante="subtitulo">{`Maior risco: ${nomeDoLugar(pior.bairro)}`}</Texto>
            <SeloRisco nivel={pior.nivel_risco} />
            {RESUMO.lugares[pior.bairro] ? (
              <Texto variante="legenda" suave>
                {`${formatarDecimal(RESUMO.lugares[pior.bairro].taxa[FAIXAS_HORARIAS.indexOf(faixa)])} roubos por dia nessa faixa, no último ano.`}
              </Texto>
            ) : null}
            <View style={[estilos.divisor, { backgroundColor: cores.linha }]} />
            <Texto variante="legendaForte">{`Os ${LUGARES.length} lugares da região ${ROTULO_FAIXA_FRASE[faixa]}`}</Texto>
            <BarraNiveis contagem={contarNiveis(previsoes, faixa)} />
          </Superficie>
        ) : (
          <Texto suave>Ainda não há previsão para este horário.</Texto>
        )}

        {maiores.length > 0 ? (
          <View style={estilos.secao}>
            <Texto variante="subtitulo">{`Maiores riscos ${ROTULO_FAIXA_FRASE[faixa]}`}</Texto>
            <Superficie opaca style={estilos.lista}>
              {maiores.map((p, i) => (
                <LinhaLugar key={p.bairro} posicao={i + 1} previsao={p} faixa={faixa} aoPressionar={() => escolher(p.bairro, true)} />
              ))}
            </Superficie>
          </View>
        ) : null}

        <View
          style={estilos.secao}
          onLayout={(e) => {
            posicaoLugar.current = e.nativeEvent.layout.y;
          }}
        >
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
                    onPress={() => escolher(l.slug, false)}
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

          {atual ? <DetalheLugar codigo={atual} previsoes={previsoes} faixa={faixa} /> : null}
        </View>

        <View style={estilos.secao}>
          <Texto variante="subtitulo">Quando os roubos acontecem</Texto>
          <Superficie opaca style={estilos.cartao}>
            <Texto variante="corpoForte">
              {`${formatarParte(RESUMO.parte_noite)} dos roubos são à noite, com pico às ${horaDePico(RESUMO.horas)}h`}
            </Texto>
            <GraficoHoras horas={RESUMO.horas} />
            <Texto variante="legenda" suave>
              Roubos de celular e de veículo em toda a região, por hora do dia. Toque no gráfico para ver cada hora.
            </Texto>
          </Superficie>
        </View>

        {RESUMO.levados ? (
          <View style={estilos.secao}>
            <Texto variante="subtitulo">O que levam</Texto>
            <Superficie opaca style={estilos.cartao}>
              <Texto variante="corpoForte">{`O celular aparece em ${formatarParte(RESUMO.levados.itens[0]?.parte ?? 0)} dos roubos`}</Texto>
              <BarrasHorizontais itens={RESUMO.levados.itens} />
              <Texto variante="legenda" suave>
                {`Parte dos ${formatarInteiro(RESUMO.levados.total)} boletins de roubo em que cada item foi levado. Um roubo pode levar mais de um item.`}
              </Texto>
            </Superficie>
          </View>
        ) : null}

        <View style={estilos.secao}>
          <Texto variante="subtitulo">Sobre o modelo</Texto>
          <Superficie opaca style={estilos.cartao}>
            <View style={estilos.numeros}>
              <Numero valor={formatarDecimal(RESUMO.modelo.f1, 2)} rotulo="F1 macro no teste de 2026" />
              <Numero valor={formatarParte(RESUMO.modelo.acuracia)} rotulo="dos níveis acertados" />
            </View>
            <Texto variante="legenda" suave>
              {`Repetir o nível do ano anterior dá F1 de ${formatarDecimal(RESUMO.modelo.f1_regra_simples, 2)}. O modelo (RandomForest) ganha por pouco e nunca confunde risco baixo com alto.`}
            </Texto>
            <View style={[estilos.divisor, { backgroundColor: cores.linha }]} />
            <Texto variante="legenda" suave>
              {`Treinado com ${formatarInteiro(RESUMO.roubos)} roubos de celular e veículo registrados pela SSP-SP de ${mesCurto(RESUMO.periodo.inicio)} a ${mesCurto(RESUMO.periodo.fim)} (dados abertos, sem nenhum dado pessoal). "Alto" são os 20% de lugar e horário com mais roubos por dia; "baixo", a metade com menos.`}
            </Texto>
            {RESUMO.mes ? (
              <Texto variante="legenda" suave>
                {`A SSP publica com ${RESUMO.mes.atraso} meses de atraso. Para ${mesPorExtenso(RESUMO.mes.referencia)}, o modelo prevê cerca de ${formatarInteiro(RESUMO.mes.regiao)} roubos na região.`}
              </Texto>
            ) : null}
          </Superficie>
        </View>

        <Texto variante="legenda" suave style={estilos.nota}>
          Serve para apoiar a decisão, não para garantir segurança.
        </Texto>
      </ScrollView>
      <FundoBarraStatus />
    </View>
  );
}

function DetalheLugar({ codigo, previsoes, faixa }: { codigo: Bairro; previsoes: PrevisaoRisco[]; faixa: FaixaHoraria }) {
  const lugar = lugarDe(codigo);
  const dados: ResumoLugar | undefined = RESUMO.lugares[codigo];
  const i = FAIXAS_HORARIAS.indexOf(faixa);
  const { maior, menor } = dados ? extremos(dados.taxa) : { maior: null, menor: null };
  const totalMes = dados?.mes ? dados.mes.reduce((s, v) => s + v, 0) : null;

  return (
    <Superficie opaca style={estilos.cartao}>
      <View>
        <Texto variante="corpoForte" accessibilityRole="header">
          {nomeDoLugar(codigo)}
        </Texto>
        <Texto variante="legenda" suave>
          {lugar ? ROTULO_TIPO_LOCAL[lugar.tipo] : ''}
        </Texto>
      </View>

      <View style={estilos.celulas}>
        {FAIXAS_HORARIAS.map((f, j) => {
          const p = riscoDe(previsoes, codigo, f);
          return (
            <View key={f} style={estilos.coluna}>
              <Texto variante="legendaForte" suave numberOfLines={1} adjustsFontSizeToFit>
                {ROTULO_FAIXA[f]}
              </Texto>
              <CelulaRisco
                nivel={p?.nivel_risco ?? null}
                taxa={dados?.taxa[j] ?? null}
                destaque={f === faixa}
                rotulo={`${nomeDoLugar(codigo)}, ${ROTULO_FAIXA[f].toLowerCase()}`}
              />
            </View>
          );
        })}
      </View>
      {dados ? (
        <Texto variante="legenda" suave>
          Roubos por dia em cada faixa, no último ano.
        </Texto>
      ) : null}

      {maior && menor && maior !== menor ? (
        <Texto>
          {'Mais arriscado '}
          <Texto variante="corpoForte">{ROTULO_FAIXA_FRASE[maior]}</Texto>
          {'; mais tranquilo '}
          <Texto variante="corpoForte">{ROTULO_FAIXA_FRASE[menor]}</Texto>.
        </Texto>
      ) : null}

      {dados ? (
        <View style={estilos.bloco}>
          <Texto variante="legendaForte">{`O que roubam aqui ${ROTULO_FAIXA_FRASE[faixa]}`}</Texto>
          {dados.celular[i] + dados.veiculo[i] > 0 ? (
            <BarraDivisao
              partes={[
                { rotulo: 'Celular', valor: dados.celular[i] },
                { rotulo: 'Veículo', valor: dados.veiculo[i] },
              ]}
            />
          ) : (
            <Texto suave>Nenhum roubo registrado nessa faixa no último ano.</Texto>
          )}
        </View>
      ) : null}

      {totalMes !== null && RESUMO.mes ? (
        <View style={estilos.bloco}>
          <Texto variante="legendaForte">{`Previsão para ${mesPorExtenso(RESUMO.mes.referencia)}`}</Texto>
          {totalMes < 1 ? (
            <Texto suave>Quase nenhum roubo previsto aqui no mês.</Texto>
          ) : (
            <Texto>
              {'Cerca de '}
              <Texto variante="corpoForte">{`${formatarInteiro(totalMes)} ${Math.round(totalMes) === 1 ? 'roubo' : 'roubos'}`}</Texto>
              {` aqui no mês, ${(dados?.mes?.[i] ?? 0) < 0.5 ? 'quase nenhum' : formatarInteiro(dados?.mes?.[i] ?? 0)} ${ROTULO_FAIXA_FRASE[faixa]}.`}
            </Texto>
          )}
        </View>
      ) : null}
    </Superficie>
  );
}

function Numero({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <View style={estilos.numero} accessible accessibilityLabel={`${valor} ${rotulo}`}>
      <Texto variante="titulo">{valor}</Texto>
      <Texto variante="legenda" suave>
        {rotulo}
      </Texto>
    </View>
  );
}

function LinhaLugar({ posicao, previsao, faixa, aoPressionar }: { posicao: number; previsao: PrevisaoRisco; faixa: FaixaHoraria; aoPressionar: () => void }) {
  const lugar = lugarDe(previsao.bairro);
  const taxa = RESUMO.lugares[previsao.bairro]?.taxa[FAIXAS_HORARIAS.indexOf(faixa)];
  const detalhe = [lugar ? ROTULO_TIPO_CURTO[lugar.tipo] : null, taxa !== undefined ? `${formatarDecimal(taxa)} roubos/dia` : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={aoPressionar}
      accessibilityRole="button"
      accessibilityLabel={`${posicao}º, ${nomeDoLugar(previsao.bairro)}, risco ${ROTULO_RISCO[previsao.nivel_risco].toLowerCase()}`}
      style={estilos.linha}
    >
      <Texto variante="legendaForte" suave style={estilos.posicao}>
        {posicao}
      </Texto>
      <View style={estilos.linhaTexto}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {nomeDoLugar(previsao.bairro)}
        </Texto>
        <Texto variante="legenda" suave numberOfLines={1}>
          {detalhe}
        </Texto>
      </View>
      <SeloRisco nivel={previsao.nivel_risco} />
    </Pressable>
  );
}

function CelulaRisco({ nivel, taxa, destaque, rotulo }: { nivel: NivelRisco | null; taxa: number | null; destaque: boolean; rotulo: string }) {
  const { cores } = useTema();
  const c = nivel ? coresDoRisco(cores, nivel) : null;
  return (
    <View
      accessible
      accessibilityLabel={
        nivel ? `${rotulo}: risco ${ROTULO_RISCO[nivel].toLowerCase()}${taxa !== null ? `, ${formatarDecimal(taxa)} roubos por dia` : ''}` : `${rotulo}: sem dados`
      }
      style={[
        estilos.celula,
        { backgroundColor: c?.suave ?? cores.superficie2 },
        destaque ? { borderWidth: 2, borderColor: cores.texto } : null,
      ]}
    >
      <Texto variante="legendaForte" cor={c?.sobre ?? cores.textoSuave} numberOfLines={1} adjustsFontSizeToFit>
        {nivel ? ROTULO_RISCO[nivel] : '–'}
      </Texto>
      {taxa !== null ? (
        <Texto variante="legenda" cor={c?.sobre ?? cores.textoSuave}>
          {formatarDecimal(taxa)}
        </Texto>
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: 16, gap: 20, paddingBottom: 32 + ESPACO_ABAS },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  destaque: { padding: 16, gap: 8 },
  divisor: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  secao: { gap: 10 },
  cartao: { padding: 16, gap: 12 },
  bloco: { gap: 8 },
  lista: { paddingVertical: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 60 },
  posicao: { width: 18, textAlign: 'right' },
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
  numeros: { flexDirection: 'row', gap: 16 },
  numero: { flex: 1, gap: 2 },
  nota: { marginTop: 4 },
});
