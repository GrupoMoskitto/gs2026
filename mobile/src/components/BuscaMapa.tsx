import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { LOCAIS, LOCAIS_SUGERIDOS, ROTULO_TIPO_LOCAL, type Local } from '@/config/locais';
import { alvoToque, raio, useTema } from '@/theme';
import { buscarLocais } from '@/utils/busca';
import { Icone } from './Icone';
import { Superficie } from './Superficie';
import { Texto } from './Texto';

interface Props {
  aoEscolher: (local: Local) => void;
  aoBuscando: (buscando: boolean) => void;
  filtrosAtivos: number;
  aoAbrirFiltros: () => void;
}

/** Barra flutuante do mapa: busca (local, nada sai do aparelho) e botão de filtros. */
export function BuscaMapa({ aoEscolher, aoBuscando, filtrosAtivos, aoAbrirFiltros }: Props) {
  const { cores } = useTema();
  const [texto, setTexto] = useState('');
  const [foco, setFoco] = useState(false);
  const campo = useRef<ComponentRef<typeof TextInput>>(null);

  const digitando = texto.trim() !== '';
  const resultados = useMemo(() => (digitando ? buscarLocais(LOCAIS, texto, 6) : LOCAIS_SUGERIDOS), [digitando, texto]);

  function mudarFoco(valor: boolean) {
    setFoco(valor);
    aoBuscando(valor);
  }

  function escolher(local: Local) {
    setTexto(local.nome);
    campo.current?.blur();
    aoEscolher(local);
  }

  function limpar() {
    setTexto('');
    campo.current?.focus();
  }

  return (
    <View style={estilos.caixa} pointerEvents="box-none">
      <Superficie variante="barra" style={estilos.barra} accessibilityRole="search">
        <Icone nome="search" tamanho={20} cor={cores.textoSuave} />
        <TextInput
          ref={campo}
          value={texto}
          onChangeText={setTexto}
          onFocus={() => mudarFoco(true)}
          onBlur={() => mudarFoco(false)}
          placeholder="Buscar bairro ou cidade"
          placeholderTextColor={cores.textoSuave}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Buscar bairro, distrito, estação ou cidade"
          style={[estilos.campo, { color: cores.texto }]}
        />
        {texto !== '' ? (
          <Pressable onPress={limpar} accessibilityRole="button" accessibilityLabel="Limpar a busca" hitSlop={8} style={estilos.limpar}>
            <Icone nome="close-circle" tamanho={20} cor={cores.textoSuave} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={aoAbrirFiltros}
          accessibilityRole="button"
          accessibilityLabel={filtrosAtivos > 0 ? `Filtros, ${filtrosAtivos} marcados` : 'Filtros'}
          style={estilos.filtro}
        >
          <Icone nome="options-outline" tamanho={22} cor={cores.texto} />
          {filtrosAtivos > 0 ? (
            <View style={[estilos.contador, { backgroundColor: cores.texto }]}>
              <Texto variante="legendaForte" cor={cores.fundo} style={estilos.contadorTexto}>
                {String(filtrosAtivos)}
              </Texto>
            </View>
          ) : null}
        </Pressable>
      </Superficie>

      {foco ? (
        <Superficie opaca variante="cartao" style={estilos.lista}>
          {!digitando ? (
            <Texto variante="legendaForte" suave style={estilos.sugestao}>
              Sugestões
            </Texto>
          ) : null}
          {resultados.length === 0 ? (
            <Texto suave style={estilos.vazio}>
              Nenhum lugar com esse nome. Tente o nome de um bairro, distrito ou cidade da região metropolitana.
            </Texto>
          ) : (
            resultados.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => escolher(l)}
                accessibilityRole="button"
                accessibilityLabel={`${l.nome}. ${ROTULO_TIPO_LOCAL[l.tipo]}`}
                style={({ pressed }) => [estilos.linha, pressed ? { backgroundColor: cores.superficie2 } : null]}
              >
                <Icone nome={l.tipo === 'estacao' ? 'train-outline' : 'location-outline'} tamanho={20} cor={cores.textoSuave} />
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
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { marginHorizontal: 16, gap: 8 },
  barra: { flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 4, minHeight: alvoToque + 4, gap: 10 },
  campo: { flex: 1, fontSize: 17, minHeight: alvoToque },
  limpar: { padding: 2 },
  filtro: { width: alvoToque, height: alvoToque, alignItems: 'center', justifyContent: 'center' },
  contador: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: { fontSize: 11, lineHeight: 14 },
  lista: { paddingVertical: 6, borderRadius: raio.lg },
  sugestao: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  vazio: { padding: 16 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52 },
  linhaTexto: { flex: 1 },
});
