import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Chip } from '@/components/Chip';
import { FundoBarraStatus } from '@/components/FundoBarraStatus';
import { Superficie } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { TituloTela } from '@/components/TituloTela';
import { API_CONFIGURADA, CONFIG_API } from '@/config/api';
import { useSessao } from '@/hooks/SessaoContexto';
import { useConexao, useFila } from '@/hooks/useConexao';
import { enviarFila } from '@/services/fila';
import { lerPreferenciaTema, salvarPreferenciaTema, type PreferenciaTema } from '@/services/tema';
import { ESPACO_ABAS, useTema } from '@/theme';
import { avisoDoEnvio } from '@/utils/avisoEnvio';

const REPOSITORIO = 'https://github.com/GrupoMoskitto/gs2026';

const OPCOES_TEMA: { id: PreferenciaTema; rotulo: string }[] = [
  { id: 'sistema', rotulo: 'Automático' },
  { id: 'claro', rotulo: 'Claro' },
  { id: 'escuro', rotulo: 'Escuro' },
];

const EQUIPE = ['Gabriel Kato · RM560000', 'Gabriel Couto · RM559579', 'João Vitor de Matos · RM559246', 'Marcelo Affonso · RM559790'];

export default function TelaAjustes() {
  const { cores } = useTema();
  const { sessao, sair } = useSessao();
  const conectado = useConexao();
  const fila = useFila();
  const [tema, setTema] = useState<PreferenciaTema>('sistema');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let ativo = true;
    void lerPreferenciaTema().then((p) => {
      if (ativo) setTema(p);
    });
    return () => {
      ativo = false;
    };
  }, []);

  function escolherTema(p: PreferenciaTema) {
    setTema(p);
    void salvarPreferenciaTema(p);
  }

  function confirmarSaida() {
    Alert.alert('Sair da conta?', 'Você vai precisar informar o apelido e o RM de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
    ]);
  }

  async function enviarAgora() {
    setEnviando(true);
    try {
      const aviso = avisoDoEnvio(await enviarFila());
      if (aviso) Alert.alert(aviso.titulo, aviso.texto);
    } catch {
      Alert.alert('Não foi possível enviar', 'Os relatos continuam guardados no aparelho. Tente de novo em instantes.');
    } finally {
      setEnviando(false);
    }
  }

  let servidor: string;
  if (!API_CONFIGURADA) servidor = 'Não configurado: o app mostra dados de exemplo.';
  else servidor = conectado ? `Conectado a ${CONFIG_API.baseUrl}` : `Sem conexão com ${CONFIG_API.baseUrl}`;

  return (
    // Esta tela fica direto sob as abas, sem pilha: o fundo precisa ser definido aqui.
    <View style={[estilos.tela, { backgroundColor: cores.fundo }]}>
    <ScrollView
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={estilos.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <TituloTela titulo="Ajustes" margem={0} />

      <Secao titulo="Aparência">
        <View style={estilos.chips} accessibilityRole="radiogroup">
          {OPCOES_TEMA.map((o) => (
            <Chip key={o.id} rotulo={o.rotulo} selecionado={tema === o.id} aoPressionar={() => escolherTema(o.id)} />
          ))}
        </View>
        <Texto variante="legenda" suave>
          Automático segue o tema do celular.
        </Texto>
      </Secao>

      <Secao titulo="Conta">
        <Linha rotulo="Apelido" valor={sessao?.apelido ?? '–'} />
        <Linha rotulo="RM" valor={sessao?.rm ?? '–'} />
        <Texto variante="legenda" suave>
          Não há senha: a identificação fica só neste aparelho.
        </Texto>
        <Botao rotulo="Sair da conta" variante="secundario" icone="log-out-outline" aoPressionar={confirmarSaida} />
      </Secao>

      <Secao titulo="Dados e envios">
        <Linha rotulo="Servidor" valor={servidor} />
        <Linha
          rotulo="Relatos aguardando envio"
          valor={fila.length === 0 ? 'Nenhum' : String(fila.length)}
        />
        {fila.length > 0 ? (
          <Botao
            rotulo="Enviar agora"
            variante="secundario"
            icone="cloud-upload-outline"
            carregando={enviando}
            desativado={!conectado}
            aoPressionar={() => void enviarAgora()}
          />
        ) : null}
        <Texto variante="legenda" suave>
          Relatos criados sem conexão ficam guardados no aparelho e são enviados quando a rede volta.
        </Texto>
      </Secao>

      <Secao titulo="Privacidade">
        <Texto>
          Os relatos não têm nome, telefone nem endereço exato. O local é aproximado (cerca de 100 m). A sua localização
          só é usada para preencher o local de um relato e não fica guardada.
        </Texto>
      </Secao>

      <Secao titulo="Sobre">
        <Linha rotulo="Aplicativo" valor="Moskitto Radar" />
        <Linha rotulo="Versão" valor={Constants.expoConfig?.version ?? '–'} />
        <Linha rotulo="Região" valor="Região Metropolitana de São Paulo" />
        <Linha rotulo="ODS" valor="11 (principal), 9 e 10" />
        <Texto variante="legenda" suave>
          Projeto da Global Solution 2026.2 da FIAP (CitizenTech). Todos os dados são simulados.
        </Texto>
        <Texto variante="legenda" suave>
          Nomes dos lugares da busca: IBGE. Pontos dos distritos: © colaboradores do OpenStreetMap (ODbL).
        </Texto>
        <Texto variante="legendaForte" suave style={estilos.tituloEquipe}>
          Equipe
        </Texto>
        {EQUIPE.map((nome) => (
          <Texto key={nome}>{nome}</Texto>
        ))}
        <Botao
          rotulo="Ver o repositório"
          variante="texto"
          icone="logo-github"
          aoPressionar={() => void Linking.openURL(REPOSITORIO)}
        />
      </Secao>
    </ScrollView>
    <FundoBarraStatus />
    </View>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={estilos.secao}>
      <Texto variante="legendaForte" suave accessibilityRole="header">
        {titulo}
      </Texto>
      <Superficie style={estilos.cartao}>{children}</Superficie>
    </View>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha} accessible accessibilityLabel={`${rotulo}: ${valor}`}>
      <Texto variante="legenda" suave>
        {rotulo}
      </Texto>
      <Texto variante="corpoForte">{valor}</Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { paddingHorizontal: 16, gap: 20, paddingBottom: 32 + ESPACO_ABAS },
  secao: { gap: 8 },
  cartao: { padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  linha: { gap: 2 },
  tituloEquipe: { marginTop: 4 },
});
