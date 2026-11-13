import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { iconeDoTipo } from '@/components/CartaoRelato';
import { Chip } from '@/components/Chip';
import { Icone } from '@/components/Icone';
import { useFundoCampo } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { LUGARES, lugarDe, nomeDoLugar, ROTULO_TIPO_LOCAL } from '@/config/locais';
import { CAIXA_REGIAO } from '@/config/regiao';
import { ehErroApi } from '@/services/erro';
import { criarRelato } from '@/services/relatos';
import { alvoToque, MARGEM, raio, useTema } from '@/theme';
import { LIMITE_DESCRICAO, TIPOS_RELATO, type Bairro, type TipoRelato } from '@/types/dominio';
import type { ResultadoEnvio } from '@/types/servicos';
import { buscarLocais } from '@/utils/busca';
import { arredondar3, bairroMaisProximo, dentroDaRegiao } from '@/utils/geo';
import { ROTULO_TIPO } from '@/utils/rotulos';
import { dataDeOpcao, OPCOES_QUANDO, type IdQuando } from '@/utils/tempo';
import { validarNovoRelato } from '@/utils/validacao';

interface Local {
  latitude: number;
  longitude: number;
  origem: 'gps' | 'bairro';
}

type EstadoGps =
  | { fase: 'parado' }
  | { fase: 'buscando' }
  | { fase: 'negada'; podePedirDeNovo: boolean }
  | { fase: 'fora' }
  | { fase: 'falhou' };

export default function NovoRelato() {
  const { cores } = useTema();
  const fundoCampo = useFundoCampo();
  const [tipo, setTipo] = useState<TipoRelato | null>(null);
  const [bairro, setBairro] = useState<Bairro | null>(null);
  const [local, setLocal] = useState<Local | null>(null);
  const [quando, setQuando] = useState<IdQuando>('agora');
  const [descricao, setDescricao] = useState('');
  const [buscaLugar, setBuscaLugar] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [gps, setGps] = useState<EstadoGps>({ fase: 'parado' });
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [concluido, setConcluido] = useState<ResultadoEnvio | null>(null);

  function escolherLugar(codigo: Bairro) {
    const lugar = lugarDe(codigo);
    if (!lugar) return;
    setBairro(codigo);
    setLocal({ latitude: lugar.latitude, longitude: lugar.longitude, origem: 'bairro' });
    setBuscaLugar('');
    setErros((e) => ({ ...e, bairro: '', local: '' }));
  }

  const sugestoes = buscarLocais(LUGARES, buscaLugar, 5);

  async function usarLocalizacao() {
    setGps({ fase: 'buscando' });
    try {
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (permissao.status !== Location.PermissionStatus.GRANTED) {
        setGps({ fase: 'negada', podePedirDeNovo: permissao.canAskAgain });
        return;
      }
      const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const ponto = { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
      if (!dentroDaRegiao(ponto)) {
        setGps({ fase: 'fora' });
        return;
      }
      setLocal({ latitude: arredondar3(ponto.latitude), longitude: arredondar3(ponto.longitude), origem: 'gps' });
      setBairro(bairroMaisProximo(ponto));
      setErros((e) => ({ ...e, bairro: '', local: '' }));
      setGps({ fase: 'parado' });
    } catch {
      setGps({ fase: 'falhou' });
    }
  }

  async function enviar() {
    setErroEnvio(null);
    const r = validarNovoRelato({
      tipo,
      bairro,
      descricao,
      latitude: local?.latitude ?? null,
      longitude: local?.longitude ?? null,
      ocorridoEm: dataDeOpcao(quando),
    });
    if (!r.ok) {
      setErros(r.erros);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setErros({});
    setEnviando(true);
    try {
      const resultado = await criarRelato(r.valor);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setConcluido(resultado);
    } catch (erro) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErroEnvio(ehErroApi(erro) ? erro.message : 'Não foi possível enviar. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    const naFila = concluido.tipo === 'na_fila';
    return (
      <View style={[estilos.concluido, { backgroundColor: cores.fundo }]} accessibilityRole="alert">
        <View style={[estilos.bolha, { backgroundColor: naFila ? cores.alertaSuave : cores.sucessoSuave }]}>
          <Icone nome={naFila ? 'time-outline' : 'checkmark'} tamanho={36} cor={naFila ? cores.sobreAlertaSuave : cores.sobreSucessoSuave} />
        </View>
        <Texto variante="titulo" style={estilos.centro}>
          {naFila ? 'Relato salvo' : 'Relato enviado'}
        </Texto>
        <Texto suave style={estilos.centro}>
          {naFila
            ? 'Sem conexão agora. O relato ficou guardado no aparelho e vai sozinho quando a rede voltar.'
            : 'Obrigado. Ele aparece no mapa depois de aprovado pela moderação.'}
        </Texto>
        <Botao rotulo="Concluir" aoPressionar={() => router.back()} />
      </View>
    );
  }

  const restantes = LIMITE_DESCRICAO - descricao.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: cores.fundo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={estilos.conteudo}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Secao titulo="O que aconteceu" erro={erros.tipo}>
          <View style={estilos.chips} accessibilityRole="radiogroup">
            {TIPOS_RELATO.map((t) => (
              <Chip key={t} rotulo={ROTULO_TIPO[t]} icone={iconeDoTipo(t)} selecionado={tipo === t} aoPressionar={() => { setTipo(t); setErros((e) => ({ ...e, tipo: '' })); }} />
            ))}
          </View>
        </Secao>

        <Secao titulo="Onde" erro={erros.local || erros.bairro}>
          <Botao
            rotulo={local?.origem === 'gps' ? 'Localização usada' : 'Usar minha localização'}
            icone={local?.origem === 'gps' ? 'checkmark-circle' : 'locate'}
            variante="secundario"
            carregando={gps.fase === 'buscando'}
            aoPressionar={() => void usarLocalizacao()}
          />
          <AvisoGps estado={gps} />
          <Texto variante="legenda" suave>
            Ou busque o distrito (na capital) ou o município. O local é aproximado, nunca o endereço exato.
          </Texto>
          <TextInput
            value={buscaLugar}
            onChangeText={setBuscaLugar}
            placeholder="Buscar distrito ou município"
            placeholderTextColor={cores.textoSuave}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Buscar distrito ou município"
            style={[estilos.campoLugar, { backgroundColor: fundoCampo, borderColor: cores.linha, color: cores.texto }]}
          />
          {buscaLugar.trim() !== '' ? (
            <View style={[estilos.sugestoes, { borderColor: cores.linha }]}>
              {sugestoes.length === 0 ? (
                <Texto suave style={estilos.semSugestao}>
                  Nenhum local com esse nome.
                </Texto>
              ) : (
                sugestoes.map((l) => (
                  <Pressable
                    key={l.slug}
                    onPress={() => escolherLugar(l.slug)}
                    accessibilityRole="button"
                    accessibilityLabel={`${l.nome}. ${ROTULO_TIPO_LOCAL[l.tipo]}`}
                    style={estilos.sugestao}
                  >
                    <Texto variante="corpoForte" numberOfLines={1}>
                      {l.nome}
                    </Texto>
                    <Texto variante="legenda" suave numberOfLines={1}>
                      {ROTULO_TIPO_LOCAL[l.tipo]}
                    </Texto>
                  </Pressable>
                ))
              )}
            </View>
          ) : null}
          {bairro ? (
            <Texto variante="corpoForte" accessibilityRole="summary">{`Local escolhido: ${nomeDoLugar(bairro)}`}</Texto>
          ) : null}
          {local ? (
            <Texto variante="legenda" suave>
              {`Local: ${local.latitude.toFixed(3)}, ${local.longitude.toFixed(3)} (${local.origem === 'gps' ? 'pela sua localização' : 'centro do local'})`}
            </Texto>
          ) : null}
        </Secao>

        <Secao titulo="Quando" erro={erros.quando}>
          <View style={estilos.chips} accessibilityRole="radiogroup">
            {OPCOES_QUANDO.map((o) => (
              <Chip key={o.id} rotulo={o.rotulo} selecionado={quando === o.id} aoPressionar={() => setQuando(o.id)} />
            ))}
          </View>
        </Secao>

        <Secao titulo="Descrição (opcional)" erro={erros.descricao}>
          <TextInput
            value={descricao}
            onChangeText={setDescricao}
            placeholder="O que aconteceu, em poucas palavras. Não escreva nomes nem placas."
            placeholderTextColor={cores.textoSuave}
            multiline
            maxLength={LIMITE_DESCRICAO + 20}
            accessibilityLabel="Descrição do relato"
            textAlignVertical="top"
            style={[estilos.descricao, { backgroundColor: fundoCampo, borderColor: erros.descricao ? cores.perigo : cores.linha, color: cores.texto }]}
          />
          <Texto variante="legenda" cor={restantes < 0 ? cores.perigo : cores.textoSuave} style={estilos.contador}>
            {restantes < 0 ? `${-restantes} caracteres a mais` : `${restantes} restantes`}
          </Texto>
        </Secao>

        {erroEnvio ? (
          <View style={[estilos.erroEnvio, { backgroundColor: cores.perigoSuave }]} accessibilityRole="alert">
            <Icone nome="alert-circle" tamanho={20} cor={cores.sobrePerigoSuave} />
            <Texto cor={cores.sobrePerigoSuave} style={estilos.erroTexto}>{erroEnvio}</Texto>
          </View>
        ) : null}

        <Botao rotulo="Enviar relato" aoPressionar={() => void enviar()} carregando={enviando} />
        <Texto variante="legenda" suave style={estilos.centro}>
          {`Só a região metropolitana de São Paulo (latitude ${CAIXA_REGIAO.latMin} a ${CAIXA_REGIAO.latMax}). Dados simulados.`}
        </Texto>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Secao({ titulo, erro, children }: { titulo: string; erro?: string; children: React.ReactNode }) {
  const { cores } = useTema();
  return (
    <View style={estilos.secao}>
      <Texto variante="corpoForte">{titulo}</Texto>
      {children}
      {erro ? (
        <Texto variante="legenda" cor={cores.perigo} accessibilityRole="alert">
          {erro}
        </Texto>
      ) : null}
    </View>
  );
}

function AvisoGps({ estado }: { estado: EstadoGps }) {
  const { cores } = useTema();
  if (estado.fase === 'parado' || estado.fase === 'buscando') return null;

  const textos: Record<'negada' | 'fora' | 'falhou', string> = {
    negada: 'Sem permissão de localização. Tudo bem: escolha o local abaixo.',
    fora: 'Você parece estar fora da região metropolitana de São Paulo. Escolha o local abaixo.',
    falhou: 'Não conseguimos pegar a localização agora. Escolha o local abaixo.',
  };
  return (
    <View style={[estilos.aviso, { backgroundColor: cores.alertaSuave }]} accessibilityRole="alert">
      <Texto variante="legenda" cor={cores.sobreAlertaSuave}>
        {textos[estado.fase]}
      </Texto>
      {estado.fase === 'negada' && !estado.podePedirDeNovo ? (
        <Botao rotulo="Abrir ajustes" variante="texto" aoPressionar={() => void Linking.openSettings()} />
      ) : null}
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: { padding: MARGEM, gap: 20, paddingBottom: 40 },
  secao: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  descricao: {
    minHeight: 100,
    borderWidth: 1,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    padding: 14,
    fontSize: 16,
  },
  campoLugar: { minHeight: alvoToque, borderWidth: 1, borderRadius: raio.md, borderCurve: 'continuous', paddingHorizontal: 14, fontSize: 16 },
  sugestoes: { borderWidth: StyleSheet.hairlineWidth, borderRadius: raio.md, borderCurve: 'continuous', overflow: 'hidden' },
  sugestao: { paddingHorizontal: 14, paddingVertical: 10, minHeight: alvoToque },
  semSugestao: { padding: 14 },
  contador: { textAlign: 'right' },
  aviso: { padding: 12, borderRadius: raio.md, borderCurve: 'continuous', gap: 4, minHeight: alvoToque },
  erroEnvio: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: raio.md, borderCurve: 'continuous' },
  erroTexto: { flex: 1 },
  concluido: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  bolha: { width: 80, height: 80, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  centro: { textAlign: 'center' },
});
