// Lugares do app. Tudo local: nada daqui sai do aparelho.
//   - Os 3 bairros da Av. Paulista e as 3 estações de metrô vêm de config/regiao.ts.
//   - Municípios da Região Metropolitana e distritos da capital vêm de data/locais.json,
//     gerado por scripts/gerar-locais.mjs (IBGE para os nomes; OpenStreetMap para o ponto dos distritos).
// LOCAIS é o que a busca do mapa encontra. LUGARES é o subconjunto que pode ser o local de um relato
// (campo `bairro` do contrato): bairros da Paulista, distritos da capital e municípios das outras cidades.
import dados from '@/data/locais.json';
import { CENTRO_BAIRRO, ESTACOES_METRO, type BairroPaulista } from './regiao';

export type TipoLocal = 'bairro' | 'estacao' | 'distrito' | 'municipio';

export interface Local {
  id: string;
  nome: string;
  tipo: TipoLocal;
  latitude: number;
  longitude: number;
}

export const ROTULO_TIPO_LOCAL: Record<TipoLocal, string> = {
  bairro: 'Bairro da Av. Paulista',
  estacao: 'Estação de metrô',
  distrito: 'Distrito de São Paulo',
  municipio: 'Município da região metropolitana',
};

const CODIGO_CAPITAL = 'mun-3550308';

const NOME_BAIRRO: Record<BairroPaulista, string> = {
  bela_vista: 'Bela Vista',
  cerqueira_cesar: 'Cerqueira César',
  consolacao: 'Consolação',
};
const CODIGOS_PAULISTA: readonly BairroPaulista[] = ['bela_vista', 'cerqueira_cesar', 'consolacao'];

const BAIRROS_PROJETO: Local[] = CODIGOS_PAULISTA.map((b) => ({ id: `bairro-${b}`, nome: NOME_BAIRRO[b], tipo: 'bairro', ...CENTRO_BAIRRO[b] }));
const ESTACOES: Local[] = ESTACOES_METRO.map((e) => ({ id: `estacao-${e.nome}`, nome: `Estação ${e.nome}`, tipo: 'estacao', latitude: e.latitude, longitude: e.longitude }));

const nomesDosBairros = new Set(BAIRROS_PROJETO.map((b) => b.nome));

const DO_IBGE: Local[] = dados.flatMap((l) =>
  // Bela Vista e Consolação já existem como bairros do projeto: não repete.
  (l.tipo === 'distrito' || l.tipo === 'municipio') && !nomesDosBairros.has(l.nome)
    ? [{ id: l.id, nome: l.nome, tipo: l.tipo, latitude: l.latitude, longitude: l.longitude }]
    : [],
);

export const LOCAIS: readonly Local[] = [...BAIRROS_PROJETO, ...ESTACOES, ...DO_IBGE];

/** Lugar que pode ser o local de um relato: tem um código (`slug`) aceito no campo `bairro`. */
export interface Lugar extends Local {
  slug: string;
}

/** Código do lugar no contrato: bela_vista, dis_355030801, mun_3509007. Estação e a capital inteira não são lugares de relato. */
function slugDoLocal(l: Local): string | null {
  if (l.tipo === 'bairro') return l.id.replace('bairro-', '');
  if (l.tipo === 'distrito' || (l.tipo === 'municipio' && l.id !== CODIGO_CAPITAL)) return l.id.replace('-', '_');
  return null;
}

export const LUGARES: readonly Lugar[] = LOCAIS.flatMap((l) => {
  const slug = slugDoLocal(l);
  return slug === null ? [] : [{ ...l, slug }];
});

const POR_CODIGO = new Map(LUGARES.map((l) => [l.slug, l]));

export function lugarDe(slug: string): Lugar | null {
  return POR_CODIGO.get(slug) ?? null;
}

/** Nome para mostrar. Código desconhecido (por exemplo, de uma API mais nova) aparece sem quebrar a tela. */
export function nomeDoLugar(slug: string): string {
  return POR_CODIGO.get(slug)?.nome ?? 'Local não identificado';
}

/** O que aparece antes de a pessoa digitar. */
export const LOCAIS_SUGERIDOS: readonly Local[] = [...BAIRROS_PROJETO, ...ESTACOES];

/** Quanto do mapa mostrar ao chegar no local: um bairro pede zoom perto; um município, longe. */
export function deltaDoLocal(l: Local): number {
  if (l.id === CODIGO_CAPITAL) return 0.25;
  switch (l.tipo) {
    case 'estacao':
      return 0.006;
    case 'bairro':
      return 0.012;
    case 'distrito':
      return 0.03;
    case 'municipio':
      return 0.12;
  }
}
