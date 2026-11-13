// Mapa: relatos aprovados como pontos e cada distrito/município pintado pelo risco de agora.
// PROPOSTA do time (AGENTS.md, seção 7, item 2). Os pontos e as zonas sempre têm texto, nunca só cor.
// No topo: busca de lugar (move o mapa) e filtro (tipo de roubo). A legenda de risco fica dentro da faixa
// do topo, para o canto inferior esquerdo ficar livre para a atribuição do Apple Maps.
import { router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BotaoNovoRelato } from '@/components/BotaoNovoRelato';
import { Botao } from '@/components/Botao';
import { BuscaMapa } from '@/components/BuscaMapa';
import { CartaoRelato } from '@/components/CartaoRelato';
import { AvisoFonte } from '@/components/Estados';
import { FolhaFiltros } from '@/components/FolhaFiltros';
import { SeloRisco } from '@/components/Selos';
import { Superficie } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { deltaDoLocal, LUGARES, nomeDoLugar, type Local } from '@/config/locais';
import { CENTRO_MAPA } from '@/config/regiao';
import { useConexao } from '@/hooks/useConexao';
import { useRecarregarAoVoltar } from '@/hooks/useRecarregarAoVoltar';
import { useRecurso } from '@/hooks/useRecurso';
import { listarPrevisoes, piorBairro, riscoDe } from '@/services/previsoes';
import { listarRelatos } from '@/services/relatos';
import { coresDoRisco, ESPACO_ABAS, useTema } from '@/theme';
import { ESTILO_MAPA_CLARO, ESTILO_MAPA_ESCURO } from '@/theme/mapaEscuro';
import type { Bairro, NivelRisco, TipoRelato } from '@/types/dominio';
import { ROTULO_FAIXA_FRASE, ROTULO_RISCO } from '@/utils/rotulos';
import { faixaAtual } from '@/utils/tempo';

// Abre mostrando a capital inteira; a busca leva a qualquer distrito ou município da região metropolitana.
const REGIAO_INICIAL = { ...CENTRO_MAPA, latitudeDelta: 0.45, longitudeDelta: 0.45 };
// Tamanho da zona pintada: o bairro da Paulista é pequeno, o distrito médio e o município grande.
const RAIO_ZONA_M = { bairro: 420, estacao: 0, distrito: 1500, municipio: 4500 } as const;

export default function TelaMapa() {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const conectado = useConexao();
  const agora = useMemo(() => faixaAtual(), []);
  const mapa = useRef<MapView>(null);
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [tipos, setTipos] = useState<TipoRelato[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [buscando, setBuscando] = useState(false);

  const relatos = useRecurso((sinal) => listarRelatos({ status: 'aprovado' }, { sinal }), []);
  const previsoes = useRecurso((sinal) => listarPrevisoes(undefined, { sinal }), []);
  const { recarregar: recarregarRelatos, atualizar: atualizarRelatos } = relatos;
  const { recarregar: recarregarPrevisoes, atualizar: atualizarPrevisoes } = previsoes;
  const recarregarTudo = useCallback(() => {
    recarregarRelatos();
    recarregarPrevisoes();
  }, [recarregarRelatos, recarregarPrevisoes]);
  // Ao voltar para a aba, atualiza em segundo plano, sem indicador.
  const atualizarTudo = useCallback(() => {
    atualizarRelatos();
    atualizarPrevisoes();
  }, [atualizarRelatos, atualizarPrevisoes]);
  useRecarregarAoVoltar(atualizarTudo);

  // O mapa aparece de imediato; relatos e risco entram quando chegam. Nada de spinner em tela cheia.
  const carregandoDados = relatos.estado.fase === 'carregando' || previsoes.estado.fase === 'carregando';
  const mensagemErro =
    relatos.estado.fase === 'erro' ? relatos.estado.mensagem : previsoes.estado.fase === 'erro' ? previsoes.estado.mensagem : null;
  const fonteRelatos = relatos.estado.fase === 'pronto' ? relatos.estado.resultado.fonte : null;
  const listaPrevisoes = previsoes.estado.fase === 'pronto' ? previsoes.estado.resultado.dados : [];
  const nivelDoBairro = (b: Bairro): NivelRisco | null => riscoDe(listaPrevisoes, b, agora)?.nivel_risco ?? null;
  const pior = piorBairro(listaPrevisoes, agora);

  // Sem nada marcado, mostra todos. Marcado mais de um tipo, vale qualquer um deles.
  const filtrosAtivos = tipos.length;
  const listaRelatos = (relatos.estado.fase === 'pronto' ? relatos.estado.resultado.dados : []).filter(
    (r) => tipos.length === 0 || tipos.includes(r.tipo),
  );
  // Se o filtro tirou o relato aberto do mapa, o cartão some junto.
  const selecionado = listaRelatos.find((r) => r.id === selecionadoId) ?? null;

  function irPara(local: Local) {
    const delta = deltaDoLocal(local);
    setSelecionadoId(null);
    mapa.current?.animateToRegion({ latitude: local.latitude, longitude: local.longitude, latitudeDelta: delta, longitudeDelta: delta }, 700);
  }

  function limparFiltros() {
    setTipos([]);
  }

  return (
    <View style={estilos.tela}>
      <MapView
        ref={mapa}
        style={StyleSheet.absoluteFill}
        initialRegion={REGIAO_INICIAL}
        onPress={() => {
          Keyboard.dismiss();
          setSelecionadoId(null);
        }}
        showsCompass={false}
        toolbarEnabled={false}
        // O mapa segue o tema escolhido nos Ajustes, não só o do sistema.
        userInterfaceStyle={escuro ? 'dark' : 'light'}
        customMapStyle={escuro ? ESTILO_MAPA_ESCURO : ESTILO_MAPA_CLARO}
        // O padding inferior levanta a atribuição do Apple Maps (canto inferior esquerdo) acima da barra de abas.
        mapPadding={{ top: 0, left: 0, right: 0, bottom: ESPACO_ABAS }}
        accessibilityLabel="Mapa com os relatos e o risco de cada distrito e município"
      >
        {LUGARES.map((lugar) => {
          const nivel = nivelDoBairro(lugar.slug);
          if (nivel === null) return null;
          const c = coresDoRisco(cores, nivel);
          return (
            <Circle
              key={lugar.slug}
              center={lugar}
              radius={RAIO_ZONA_M[lugar.tipo]}
              fillColor={`${c.cor}22`}
              strokeColor={`${c.cor}55`}
              strokeWidth={1}
            />
          );
        })}
        {listaRelatos.map((r) => {
          const nivel = nivelDoBairro(r.bairro);
          const ativo = selecionado?.id === r.id;
          const tamanho = ativo ? 24 : 14;
          return (
            // Ponto pequeno no lugar do pino padrão: menos peso e menos sobreposição.
            // A chave muda com a seleção para o marcador redesenhar com o novo tamanho.
            <Marker
              key={`${r.id}-${ativo ? 'a' : 'n'}-${escuro ? 'e' : 'c'}`}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              onPress={(e) => {
                e.stopPropagation();
                setSelecionadoId(r.id);
              }}
              accessibilityLabel={`Relato de ${nomeDoLugar(r.bairro)}`}
            >
              <View
                style={[
                  estilos.ponto,
                  {
                    width: tamanho,
                    height: tamanho,
                    borderRadius: tamanho / 2,
                    backgroundColor: nivel ? coresDoRisco(cores, nivel).cor : cores.primaria,
                    borderWidth: ativo ? 3 : 2,
                  },
                ]}
              />
            </Marker>
          );
        })}
      </MapView>

      <View style={[estilos.topo, { top: insets.top + 8 }]} pointerEvents="box-none">
        <BuscaMapa aoEscolher={irPara} aoBuscando={setBuscando} filtrosAtivos={filtrosAtivos} aoAbrirFiltros={() => setFiltrosAbertos(true)} />

        {/* Enquanto a pessoa busca, a lista de resultados ocupa o lugar do resto. */}
        {buscando ? null : (
          <>
            {/* Só avisa o que muda a leitura (sem conexão ou dados salvos). O aviso de "exemplo" fica nas outras abas. */}
            {fonteRelatos !== null && (fonteRelatos === 'cache' || !conectado) ? (
              <View style={estilos.margem}>
                <AvisoFonte fonte={fonteRelatos} conectado={conectado} />
              </View>
            ) : null}
            {carregandoDados ? (
              <Superficie variante="barra" style={estilos.estadoDados} accessibilityRole="progressbar" accessibilityLabel="Carregando relatos e risco">
                <ActivityIndicator color={cores.primaria} />
                <Texto suave>Carregando relatos e risco…</Texto>
              </Superficie>
            ) : null}
            {mensagemErro !== null ? (
              <Superficie variante="barra" style={estilos.estadoDados} accessibilityRole="alert">
                <Texto style={estilos.semResultadoTexto}>{mensagemErro}</Texto>
                <Botao rotulo="Tentar de novo" variante="texto" aoPressionar={recarregarTudo} />
              </Superficie>
            ) : null}
            {pior ? (
              <Superficie variante="barra" style={estilos.faixa} accessible accessibilityRole="summary">
                <View style={estilos.faixaLinha}>
                  <View style={estilos.faixaTexto}>
                    <Texto variante="legendaForte" suave>{`Agora, ${ROTULO_FAIXA_FRASE[agora]}`}</Texto>
                    <Texto variante="corpoForte">{`Maior risco: ${nomeDoLugar(pior.bairro)}`}</Texto>
                  </View>
                  <SeloRisco nivel={pior.nivel_risco} />
                </View>
                <View style={estilos.legenda} accessible accessibilityLabel="Legenda das zonas: risco baixo, médio e alto">
                  {(['baixo', 'medio', 'alto'] as const).map((n) => (
                    <View key={n} style={estilos.itemLegenda}>
                      <View style={[estilos.bolinha, { backgroundColor: coresDoRisco(cores, n).cor }]} />
                      <Texto variante="legenda">{ROTULO_RISCO[n]}</Texto>
                    </View>
                  ))}
                </View>
              </Superficie>
            ) : null}
            {filtrosAtivos > 0 && listaRelatos.length === 0 ? (
              <Superficie variante="barra" style={estilos.semResultado} accessibilityRole="alert">
                <Texto style={estilos.semResultadoTexto}>Nenhum relato com esses filtros.</Texto>
                <Botao rotulo="Limpar" variante="texto" aoPressionar={limparFiltros} />
              </Superficie>
            ) : null}
          </>
        )}
      </View>

      {selecionado ? (
        <View style={estilos.detalhe}>
          <CartaoRelato flutuante relato={selecionado} aoPressionar={() => router.push({ pathname: '/relato/[id]', params: { id: selecionado.id } })} />
        </View>
      ) : null}

      <BotaoNovoRelato />

      <FolhaFiltros
        visivel={filtrosAbertos}
        aoFechar={() => setFiltrosAbertos(false)}
        tipos={tipos}
        aoMudarTipos={setTipos}
        total={listaRelatos.length}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  topo: { position: 'absolute', left: 0, right: 0, gap: 8 },
  margem: { marginHorizontal: 16 },
  faixa: { marginHorizontal: 16, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  faixaLinha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faixaTexto: { flex: 1 },
  legenda: { flexDirection: 'row', gap: 16 },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
  estadoDados: { marginHorizontal: 16, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  semResultado: { marginHorizontal: 16, paddingLeft: 16, paddingRight: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  semResultadoTexto: { flex: 1 },
  detalhe: { position: 'absolute', left: 16, right: 16, bottom: 88 + ESPACO_ABAS },
  ponto: { borderColor: '#FFFFFF' },
});
