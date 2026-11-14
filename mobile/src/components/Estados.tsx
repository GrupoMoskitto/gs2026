import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTema, raio } from '@/theme';
import type { FonteDados } from '@/types/servicos';
import { Botao } from './Botao';
import { Icone, type NomeIcone } from './Icone';
import { Superficie } from './Superficie';
import { Texto } from './Texto';

export function Carregando({ rotulo = 'Carregando…' }: { rotulo?: string }) {
  const { cores } = useTema();
  return (
    <View style={estilos.centro} accessibilityRole="progressbar" accessibilityLabel={rotulo}>
      <ActivityIndicator size="large" color={cores.primaria} />
      <Texto suave>{rotulo}</Texto>
    </View>
  );
}

export function Erro({ mensagem, aoTentarDeNovo }: { mensagem: string; aoTentarDeNovo?: () => void }) {
  const { cores } = useTema();
  return (
    <View style={estilos.centro} accessibilityRole="alert">
      <View style={[estilos.bolha, { backgroundColor: cores.perigoSuave }]}>
        <Icone nome="cloud-offline-outline" tamanho={28} cor={cores.sobrePerigoSuave} />
      </View>
      <Texto variante="subtitulo" style={estilos.titulo}>
        Não foi possível carregar
      </Texto>
      <Texto suave style={estilos.titulo}>
        {mensagem}
      </Texto>
      {aoTentarDeNovo ? <Botao rotulo="Tentar de novo" icone="refresh" aoPressionar={aoTentarDeNovo} /> : null}
    </View>
  );
}

export function Vazio({
  titulo,
  descricao,
  icone = 'documents-outline',
  rotuloAcao,
  aoAcionar,
}: {
  titulo: string;
  descricao?: string;
  icone?: NomeIcone;
  rotuloAcao?: string;
  aoAcionar?: () => void;
}) {
  const { cores } = useTema();
  return (
    <View style={estilos.centro}>
      <View style={[estilos.bolha, { backgroundColor: cores.primariaSuave }]}>
        <Icone nome={icone} tamanho={28} cor={cores.sobrePrimariaSuave} />
      </View>
      <Texto variante="subtitulo" style={estilos.titulo}>
        {titulo}
      </Texto>
      {descricao ? (
        <Texto suave style={estilos.titulo}>
          {descricao}
        </Texto>
      ) : null}
      {rotuloAcao && aoAcionar ? <Botao rotulo={rotuloAcao} aoPressionar={aoAcionar} /> : null}
    </View>
  );
}

export function AvisoFonte({ fonte, conectado }: { fonte: FonteDados; conectado: boolean }) {
  const { cores } = useTema();
  if (fonte === 'api' && conectado) return null;
  // Só para gravar o vídeo de apresentação: esconde a faixa de "dados de exemplo". Sem a variável, ela aparece.
  if (fonte === 'exemplo' && conectado && process.env.EXPO_PUBLIC_MODO_VIDEO === '1') return null;

  let titulo: string;
  let texto: string;
  let icone: NomeIcone;
  let fundo = cores.alertaSuave;
  let letra = cores.sobreAlertaSuave;

  if (!conectado) {
    titulo = 'Sem conexão.';
    texto = fonte === 'exemplo' ? 'Mostrando dados de exemplo.' : 'Mostrando dados salvos.';
    icone = 'cloud-offline-outline';
  } else if (fonte === 'cache') {
    titulo = 'Servidor fora do ar.';
    texto = 'Mostrando dados salvos.';
    icone = 'cloud-offline-outline';
  } else {
    titulo = 'Dados de exemplo.';
    texto = 'A API ainda não está conectada.';
    icone = 'flask-outline';
    fundo = cores.primariaSuave;
    letra = cores.sobrePrimariaSuave;
  }

  return (
    <Superficie
      tinta={`${fundo}CC`}
      fundoSolido={fundo}
      style={estilos.aviso}
      accessibilityRole="alert"
      accessible
    >
      <Icone nome={icone} tamanho={18} cor={letra} />
      <Texto variante="legenda" cor={letra} style={estilos.avisoTexto}>
        <Texto variante="legendaForte" cor={letra}>{`${titulo} `}</Texto>
        {texto}
      </Texto>
    </Superficie>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  bolha: { width: 64, height: 64, borderRadius: raio.pilula, alignItems: 'center', justifyContent: 'center' },
  titulo: { textAlign: 'center' },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avisoTexto: { flex: 1 },
});
