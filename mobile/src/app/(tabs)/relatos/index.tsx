// Lista de relatos: título e busca fixos no topo; abaixo, carregando, erro, vazio, sem conexão
// e puxar para atualizar. O topo fica sempre na tela, mesmo enquanto a lista carrega.
import { router } from 'expo-router';
import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { BotaoNovoRelato } from '@/components/BotaoNovoRelato';
import { CartaoRelato, iconeDoTipo } from '@/components/CartaoRelato';
import { AvisoFonte, Carregando, Erro, Vazio } from '@/components/Estados';
import { Icone } from '@/components/Icone';
import { Superficie, useFundoCampo } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { TituloTela } from '@/components/TituloTela';
import { nomeDoLugar } from '@/config/locais';
import { useConexao, useFila } from '@/hooks/useConexao';
import { useRecarregarAoVoltar } from '@/hooks/useRecarregarAoVoltar';
import { useRecurso } from '@/hooks/useRecurso';
import { listarRelatos } from '@/services/relatos';
import { alvoToque, ESPACO_ABAS, raio, useTema } from '@/theme';
import type { RelatoPendente } from '@/types/servicos';
import { normalizar } from '@/utils/busca';
import { ROTULO_TIPO } from '@/utils/rotulos';

function CartaoPendente({ pendente }: { pendente: RelatoPendente }) {
  const { cores } = useTema();
  const { novo } = pendente;
  return (
    <Superficie
      opaca
      accessible
      accessibilityLabel={`${ROTULO_TIPO[novo.tipo]}, ${nomeDoLugar(novo.bairro)}. Aguardando envio.`}
      style={estilos.pendente}
    >
      <View style={[estilos.iconePendente, { backgroundColor: cores.primariaSuave }]}>
        <Icone nome="time-outline" tamanho={22} cor={cores.sobrePrimariaSuave} />
      </View>
      <View style={estilos.corpoPendente}>
        <Texto variante="corpoForte" numberOfLines={1}>
          {`${ROTULO_TIPO[novo.tipo]}, ${nomeDoLugar(novo.bairro)}`}
        </Texto>
        <Texto variante="legenda" suave>
          Aguardando envio. Vai sozinho quando a conexão voltar.
        </Texto>
      </View>
      <Icone nome={iconeDoTipo(novo.tipo)} tamanho={20} cor={cores.textoSuave} />
    </Superficie>
  );
}

export default function TelaRelatos() {
  const { cores } = useTema();
  const fundoCampo = useFundoCampo();
  const [busca, setBusca] = useState('');
  const campo = useRef<ComponentRef<typeof TextInput>>(null);
  const conectado = useConexao();
  const fila = useFila();
  // Busca todos uma vez e filtra no aparelho: digitar na busca é instantâneo, sem spinner.
  const { estado, recarregando, recarregar, atualizar } = useRecurso((sinal) => listarRelatos({}, { sinal }), []);
  // Ao voltar para a aba, atualiza em segundo plano, sem indicador de recarga.
  useRecarregarAoVoltar(atualizar);

  const termo = normalizar(busca);
  const visiveis = useMemo(() => {
    if (estado.fase !== 'pronto') return [];
    return estado.resultado.dados.filter(
      (r) => termo === '' || normalizar(`${r.descricao ?? ''} ${ROTULO_TIPO[r.tipo]} ${nomeDoLugar(r.bairro)}`).includes(termo),
    );
  }, [estado, termo]);

  return (
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>

      {/* Topo fixo: não rola com a lista e não some durante o carregamento. */}
      <View style={estilos.topo}>
        <TituloTela titulo="Relatos" />
        <View style={[estilos.busca, { backgroundColor: fundoCampo, borderColor: cores.linha }]}>
          <Icone nome="search" tamanho={20} cor={cores.textoSuave} />
          <TextInput
            ref={campo}
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por tipo, local ou descrição"
            placeholderTextColor={cores.textoSuave}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar relatos"
            style={[estilos.campoBusca, { color: cores.texto }]}
          />
          {busca !== '' ? (
            <Pressable onPress={() => setBusca('')} accessibilityRole="button" accessibilityLabel="Limpar a busca" hitSlop={8}>
              <Icone nome="close-circle" tamanho={20} cor={cores.textoSuave} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {estado.fase === 'carregando' ? <Carregando rotulo="Carregando relatos…" /> : null}
      {estado.fase === 'erro' ? <Erro mensagem={estado.mensagem} aoTentarDeNovo={recarregar} /> : null}

      {estado.fase === 'pronto' ? (
        <FlatList
          data={visiveis}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          keyExtractor={(r) => r.id}
          contentInsetAdjustmentBehavior="never"
          ListHeaderComponent={
            <View style={estilos.cabecalhoLista}>
              <AvisoFonte fonte={estado.resultado.fonte} conectado={conectado} />
              {fila.length > 0 ? (
                <View style={estilos.fila}>
                  <Texto variante="legendaForte" suave>
                    {fila.length === 1 ? '1 relato aguardando envio' : `${fila.length} relatos aguardando envio`}
                  </Texto>
                  {fila.map((p) => (
                    <CartaoPendente key={p.chave} pendente={p} />
                  ))}
                </View>
              ) : null}
            </View>
          }
          ItemSeparatorComponent={Separador}
          renderItem={({ item }) => (
            <View style={estilos.item}>
              <CartaoRelato relato={item} aoPressionar={() => router.push({ pathname: '/relato/[id]', params: { id: item.id } })} />
            </View>
          )}
          ListEmptyComponent={
            termo !== '' ? (
              <Vazio
                icone="search-outline"
                titulo="Nenhum relato encontrado"
                descricao="Tente outra palavra ou outro local."
                rotuloAcao="Limpar busca"
                aoAcionar={() => setBusca('')}
              />
            ) : (
              <Vazio
                icone="shield-checkmark-outline"
                titulo="Nenhum relato por aqui"
                descricao="Ainda não há relatos. Seja o primeiro a relatar."
                rotuloAcao="Novo relato"
                aoAcionar={() => router.push('/novo')}
              />
            )
          }
          refreshControl={
            <RefreshControl refreshing={recarregando} onRefresh={recarregar} tintColor={cores.primaria} colors={[cores.primaria]} />
          }
          contentContainerStyle={estilos.lista}
          initialNumToRender={10}
          windowSize={7}
        />
      ) : null}

      <BotaoNovoRelato />
    </View>
  );
}

function Separador() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  topo: { paddingBottom: 8, gap: 8 },
  busca: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, paddingHorizontal: 14, minHeight: alvoToque, borderRadius: raio.pilula, borderWidth: StyleSheet.hairlineWidth },
  campoBusca: { flex: 1, fontSize: 17, minHeight: alvoToque },
  cabecalhoLista: { gap: 8, paddingTop: 4, paddingBottom: 4 },
  lista: { paddingBottom: 88 + ESPACO_ABAS },
  fila: { paddingHorizontal: 16, gap: 8 },
  item: { paddingHorizontal: 16 },
  separador: { height: 10 },
  pendente: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 72 },
  iconePendente: { width: 44, height: 44, borderRadius: raio.md, alignItems: 'center', justifyContent: 'center' },
  corpoPendente: { flex: 1, gap: 2 },
});
