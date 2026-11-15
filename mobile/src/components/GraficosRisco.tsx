import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { coresDoRisco, useTema } from '@/theme';
import { NIVEIS_RISCO, type NivelRisco } from '@/types/dominio';
import { formatarInteiro, formatarParte } from '@/utils/numeros';
import { horaDePico, rotuloDaHora } from '@/utils/risco';
import { ROTULO_RISCO } from '@/utils/rotulos';
import { Texto } from './Texto';

const VAO = 2;
const PONTA = 4;

/** Quantos lugares há em cada nível, numa barra só, do alto ao baixo. */
export function BarraNiveis({ contagem }: { contagem: Record<NivelRisco, number> }) {
  const { cores } = useTema();
  const ordem = [...NIVEIS_RISCO].reverse();
  const total = ordem.reduce((s, n) => s + contagem[n], 0);
  if (total === 0) return null;
  return (
    <View
      style={estilos.niveis}
      accessible
      accessibilityLabel={ordem.map((n) => `${contagem[n]} lugares com risco ${ROTULO_RISCO[n].toLowerCase()}`).join(', ')}
    >
      <View style={[estilos.barraEmpilhada, { gap: VAO }]}>
        {ordem.map((n) =>
          contagem[n] > 0 ? (
            <View key={n} style={{ flex: contagem[n], backgroundColor: coresDoRisco(cores, n).cor, borderRadius: PONTA }} />
          ) : null,
        )}
      </View>
      <View style={estilos.legendaLinha}>
        {ordem.map((n) => (
          <View key={n} style={estilos.itemLegenda}>
            <View style={[estilos.bolinha, { backgroundColor: coresDoRisco(cores, n).cor }]} />
            <Texto variante="legenda">
              <Texto variante="legendaForte">{contagem[n]}</Texto>
              {` ${ROTULO_RISCO[n].toLowerCase()}`}
            </Texto>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Divide um total em duas partes (ex.: celular e veículo), com o nome e a parte escritos ao lado. */
export function BarraDivisao({ partes }: { partes: { rotulo: string; valor: number }[] }) {
  const { cores } = useTema();
  const total = partes.reduce((s, p) => s + p.valor, 0);
  if (total === 0) return null;
  const tons = [cores.primaria, cores.textoSuave];
  return (
    <View style={estilos.niveis} accessible accessibilityLabel={partes.map((p) => `${p.rotulo}: ${formatarParte(p.valor / total)}`).join(', ')}>
      <View style={[estilos.barraEmpilhada, { gap: VAO }]}>
        {partes.map((p, i) =>
          p.valor > 0 ? <View key={p.rotulo} style={{ flex: p.valor, backgroundColor: tons[i], borderRadius: PONTA }} /> : null,
        )}
      </View>
      <View style={estilos.legendaLinha}>
        {partes.map((p, i) => (
          <View key={p.rotulo} style={estilos.itemLegenda}>
            <View style={[estilos.bolinha, { backgroundColor: tons[i] }]} />
            <Texto variante="legenda">
              {`${p.rotulo} `}
              <Texto variante="legendaForte">{formatarParte(p.valor / total)}</Texto>
            </Texto>
          </View>
        ))}
      </View>
    </View>
  );
}

const ALTURA_HORAS = 112;
const MARCAS = [0, 6, 12, 18];

/** Roubos por hora do dia. Tocar no gráfico mostra o número da hora tocada. */
export function GraficoHoras({ horas }: { horas: number[] }) {
  const { cores } = useTema();
  const pico = horaDePico(horas);
  const [hora, setHora] = useState(pico);
  const [largura, setLargura] = useState(0);
  const maximo = horas[pico] || 1;
  const valor = `${rotuloDaHora(hora)}: ${formatarInteiro(horas[hora])} roubos${hora === pico ? ' (pico)' : ''}`;

  return (
    <View style={estilos.horas}>
      <Texto variante="legenda" suave>
        <Texto variante="legendaForte">{`${rotuloDaHora(hora)}: `}</Texto>
        {`${formatarInteiro(horas[hora])} roubos${hora === pico ? ' (pico)' : ''}`}
      </Texto>
      <Pressable
        onLayout={(e) => setLargura(e.nativeEvent.layout.width)}
        onPress={(e) => {
          if (largura > 0) setHora(Math.min(23, Math.max(0, Math.floor((e.nativeEvent.locationX / largura) * 24))));
        }}
        accessibilityRole="adjustable"
        accessibilityLabel="Roubos por hora do dia"
        accessibilityValue={{ text: valor }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => setHora((h) => (e.nativeEvent.actionName === 'increment' ? (h + 1) % 24 : (h + 23) % 24))}
        style={[estilos.areaHoras, { borderBottomColor: cores.linha }]}
      >
        <View style={[estilos.faixaNoite, { backgroundColor: cores.superficie2 }]} pointerEvents="none">
          <Texto variante="legenda" suave style={estilos.rotuloNoite}>
            noite
          </Texto>
        </View>
        {horas.map((v, h) => (
          <View key={h} style={estilos.colunaHora} pointerEvents="none">
            <View
              style={{
                height: Math.max(2, (v / maximo) * (ALTURA_HORAS - 20)),
                backgroundColor: h === hora ? cores.texto : cores.primaria,
                borderTopLeftRadius: PONTA,
                borderTopRightRadius: PONTA,
              }}
            />
          </View>
        ))}
      </Pressable>
      <View style={estilos.eixo}>
        {MARCAS.map((h) => (
          <Texto key={h} variante="legenda" suave style={[estilos.marca, { left: `${(h / 24) * 100}%` }]}>
            {`${h}h`}
          </Texto>
        ))}
      </View>
    </View>
  );
}

/** Barras deitadas, uma por item, com a parte escrita no fim. */
export function BarrasHorizontais({ itens }: { itens: { rotulo: string; parte: number }[] }) {
  const { cores } = useTema();
  const maior = Math.max(...itens.map((i) => i.parte), 0.0001);
  return (
    <View style={estilos.listaBarras}>
      {itens.map((i) => (
        <View key={i.rotulo} style={estilos.linhaBarra} accessible accessibilityLabel={`${i.rotulo}: ${formatarParte(i.parte)}`}>
          <Texto variante="legenda" style={estilos.rotuloBarra} numberOfLines={2}>
            {i.rotulo}
          </Texto>
          <View style={estilos.trilho}>
            <View style={{ width: `${(i.parte / maior) * 100}%`, height: 10, backgroundColor: cores.primaria, borderRadius: PONTA }} />
          </View>
          <Texto variante="legendaForte" style={estilos.valorBarra}>
            {formatarParte(i.parte)}
          </Texto>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  niveis: { gap: 8 },
  barraEmpilhada: { flexDirection: 'row', height: 12 },
  legendaLinha: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 4 },
  itemLegenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bolinha: { width: 10, height: 10, borderRadius: 5 },
  horas: { gap: 8 },
  areaHoras: { height: ALTURA_HORAS, flexDirection: 'row', alignItems: 'flex-end', gap: VAO, borderBottomWidth: StyleSheet.hairlineWidth },
  faixaNoite: { position: 'absolute', top: 0, bottom: 0, left: '75%', right: 0, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  rotuloNoite: { textAlign: 'center', marginTop: 2 },
  colunaHora: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  eixo: { height: 18 },
  marca: { position: 'absolute' },
  listaBarras: { gap: 10 },
  linhaBarra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rotuloBarra: { width: 116 },
  trilho: { flex: 1 },
  valorBarra: { width: 40, textAlign: 'right' },
});
