import { Stack, useLocalSearchParams } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { iconeDoTipo } from '@/components/CartaoRelato';
import { AvisoFonte, Carregando, Erro } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { SeloRisco, SeloStatus } from '@/components/Selos';
import { Superficie } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { useConexao } from '@/hooks/useConexao';
import { useRecurso } from '@/hooks/useRecurso';
import { listarPrevisoes, riscoDe } from '@/services/previsoes';
import { obterRelato } from '@/services/relatos';
import { nomeDoLugar } from '@/config/locais';
import { raio, useTema } from '@/theme';
import { ESTILO_MAPA_CLARO, ESTILO_MAPA_ESCURO } from '@/theme/mapaEscuro';
import type { Bairro, Origem } from '@/types/dominio';
import { ROTULO_FAIXA_FRASE, ROTULO_TIPO } from '@/utils/rotulos';
import { faixaAtual, formatarQuando } from '@/utils/tempo';

const ROTULO_ORIGEM: Record<Origem, string> = {
  mobile: 'Aplicativo do cidadão',
  desktop: 'Aplicativo do moderador',
  iot: 'Botão de pânico',
};

export default function DetalheRelato() {
  const { cores, escuro } = useTema();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conectado = useConexao();
  const { estado, recarregando, recarregar } = useRecurso((sinal) => obterRelato(String(id), { sinal }), [id]);

  if (estado.fase === 'carregando') return <Carregando rotulo="Carregando o relato…" />;
  if (estado.fase === 'erro') return <Erro mensagem={estado.mensagem} aoTentarDeNovo={() => void recarregar()} />;

  const relato = estado.resultado.dados;
  const titulo = `${ROTULO_TIPO[relato.tipo]}, ${nomeDoLugar(relato.bairro)}`;

  return (
    <ScrollView
      // O cabeçalho nativo é translúcido no iOS 26: sem isto o conteúdo começava por baixo dele.
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: cores.fundo }}
      contentContainerStyle={estilos.conteudo}
      refreshControl={<RefreshControl refreshing={recarregando} onRefresh={() => void recarregar()} tintColor={cores.primaria} colors={[cores.primaria]} />}
    >
      <Stack.Screen options={{ title: ROTULO_TIPO[relato.tipo] }} />
      <AvisoFonte fonte={estado.resultado.fonte} conectado={conectado} />

      <View style={estilos.mapa} accessibilityLabel={`Mapa com o local aproximado do relato em ${nomeDoLugar(relato.bairro)}`}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={{ latitude: relato.latitude, longitude: relato.longitude, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
          userInterfaceStyle={escuro ? 'dark' : 'light'}
          customMapStyle={escuro ? ESTILO_MAPA_ESCURO : ESTILO_MAPA_CLARO}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          <Marker coordinate={{ latitude: relato.latitude, longitude: relato.longitude }} pinColor={cores.perigo} />
        </MapView>
      </View>

      <Superficie style={estilos.cartao}>
        <View style={estilos.cabecalho}>
          <View style={[estilos.icone, { backgroundColor: cores.primariaSuave }]}>
            <Icone nome={iconeDoTipo(relato.tipo)} tamanho={26} cor={cores.sobrePrimariaSuave} />
          </View>
          <View style={estilos.cabecalhoTexto}>
            <Texto variante="subtitulo">{titulo}</Texto>
            <Texto suave>{formatarQuando(relato.ocorrido_em)}</Texto>
          </View>
        </View>
        <SeloStatus status={relato.status} />
        {relato.descricao ? <Texto>{relato.descricao}</Texto> : <Texto suave>Sem descrição.</Texto>}
      </Superficie>

      <RiscoDaRegiao bairro={relato.bairro} />

      <Superficie style={estilos.cartao}>
        <Linha rotulo="Origem" valor={ROTULO_ORIGEM[relato.origem]} />
        <Linha rotulo="Local aproximado" valor={`${relato.latitude.toFixed(3)}, ${relato.longitude.toFixed(3)}`} />
      </Superficie>
    </ScrollView>
  );
}

function RiscoDaRegiao({ bairro }: { bairro: Bairro }) {
  const { estado } = useRecurso((sinal) => listarPrevisoes(bairro, { sinal }), [bairro]);
  const agora = faixaAtual();
  if (estado.fase !== 'pronto') return null;
  const p = riscoDe(estado.resultado.dados, bairro, agora);
  if (!p) return null;
  return (
    <Superficie style={estilos.cartao} accessible>
      <Texto variante="legendaForte" suave>{`Risco em ${nomeDoLugar(bairro)} agora, ${ROTULO_FAIXA_FRASE[agora]}`}</Texto>
      <SeloRisco nivel={p.nivel_risco} />
    </Superficie>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Texto variante="legendaForte" suave>
        {rotulo}
      </Texto>
      <Texto variante="corpo">{valor}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: 16, gap: 12, paddingBottom: 32 },
  mapa: { height: 180, borderRadius: raio.lg, borderCurve: 'continuous', overflow: 'hidden' },
  cartao: { padding: 16, gap: 10 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cabecalhoTexto: { flex: 1, gap: 2 },
  icone: { width: 48, height: 48, borderRadius: raio.md, alignItems: 'center', justifyContent: 'center' },
  linha: { gap: 2 },
});
