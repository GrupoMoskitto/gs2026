import { Redirect } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/Botao';
import { Icone } from '@/components/Icone';
import { useFundoCampo } from '@/components/Superficie';
import { Texto } from '@/components/Texto';
import { useSessao } from '@/hooks/SessaoContexto';
import { MARGEM, raio, useTema } from '@/theme';
import { validarIdentificacao } from '@/utils/validacao';

const LOGO_CLARA = require('../../assets/brand/logo-mark-512.png') as number;
const LOGO_ESCURA = require('../../assets/brand/logo-mark-light-512.png') as number;

type CampoId = 'apelido' | 'rm';

export default function Identificacao() {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const fundoCampo = useFundoCampo();
  const { sessao, entrar } = useSessao();
  const [apelido, setApelido] = useState('');
  const [rm, setRm] = useState('');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [foco, setFoco] = useState<CampoId | null>(null);
  const [salvando, setSalvando] = useState(false);
  const campoRm = useRef<ComponentRef<typeof TextInput>>(null);

  async function continuar() {
    const r = validarIdentificacao(apelido, rm);
    if (!r.ok) {
      setErros(r.erros);
      return;
    }
    setErros({});
    setSalvando(true);
    await entrar(r.valor);
  }

  if (sessao !== null) return <Redirect href="/mapa" />;

  const estiloCampo = (id: CampoId) => [
    estilos.campo,
    {
      backgroundColor: fundoCampo,
      color: cores.texto,
      borderColor: erros[id] ? cores.perigo : foco === id ? cores.primaria : cores.linha,
      borderWidth: erros[id] || foco === id ? 2 : 1,
    },
  ];

  return (
    <KeyboardAvoidingView style={[estilos.tela, { backgroundColor: cores.fundo }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[estilos.conteudo, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={estilos.marca} accessibilityRole="header">
          <Image
            source={escuro ? LOGO_ESCURA : LOGO_CLARA}
            style={estilos.logo}
            resizeMode="contain"
            accessibilityLabel="Logo do Moskitto Radar"
          />
          <Texto variante="corpoForte">Moskitto Radar</Texto>
        </View>

        <View style={estilos.meio}>
          <View style={estilos.texto}>
            <Texto variante="titulo" style={estilos.titulo}>
              Onde e quando o risco é maior em São Paulo.
            </Texto>
            <Texto suave>Relate o que aconteceu e veja a previsão por local e horário.</Texto>
          </View>

          <View style={estilos.campos}>
            <View style={estilos.grupo}>
              <Texto variante="legendaForte" suave>
                Apelido
              </Texto>
              <TextInput
                value={apelido}
                onChangeText={setApelido}
                onFocus={() => setFoco('apelido')}
                onBlur={() => setFoco(null)}
                placeholder="Como quer ser chamado"
                placeholderTextColor={cores.textoSuave}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                maxLength={24}
                onSubmitEditing={() => campoRm.current?.focus()}
                accessibilityLabel="Apelido"
                style={estiloCampo('apelido')}
              />
              {erros.apelido ? (
                <Texto variante="legenda" cor={cores.perigo} accessibilityRole="alert">
                  {erros.apelido}
                </Texto>
              ) : null}
            </View>

            <View style={estilos.grupo}>
              <Texto variante="legendaForte" suave>
                RM
              </Texto>
              <TextInput
                ref={campoRm}
                value={rm}
                onChangeText={setRm}
                onFocus={() => setFoco('rm')}
                onBlur={() => setFoco(null)}
                placeholder="Exemplo: 559579"
                placeholderTextColor={cores.textoSuave}
                keyboardType="number-pad"
                maxLength={8}
                returnKeyType="done"
                onSubmitEditing={() => void continuar()}
                accessibilityLabel="RM"
                style={estiloCampo('rm')}
              />
              {erros.rm ? (
                <Texto variante="legenda" cor={cores.perigo} accessibilityRole="alert">
                  {erros.rm}
                </Texto>
              ) : null}
            </View>
          </View>

          <Botao rotulo="Continuar" aoPressionar={() => void continuar()} carregando={salvando} style={estilos.botao} />
        </View>

        <View style={estilos.rodape}>
          <Icone nome="lock-closed-outline" tamanho={16} cor={cores.textoSuave} />
          <Texto variante="legenda" suave style={estilos.rodapeTexto}>
            Sem senha e sem dados pessoais. O apelido e o RM ficam só neste aparelho.
          </Texto>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1 },
  conteudo: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: MARGEM * 1.5, gap: 32 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 36, height: 36 },
  meio: { gap: 28 },
  texto: { gap: 12 },
  titulo: { fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
  campos: { gap: 16 },
  grupo: { gap: 6 },
  campo: {
    minHeight: 56,
    borderRadius: raio.md,
    borderCurve: 'continuous',
    paddingHorizontal: 16,
    fontSize: 17,
  },
  botao: { minHeight: 56 },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rodapeTexto: { flex: 1 },
});
