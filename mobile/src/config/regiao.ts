// Região do projeto: Região Metropolitana de São Paulo (capital por distritos, demais cidades por município).
// PROVISÓRIO: a caixa de coordenadas ainda é decisão em aberto (AGENTS.md, seção 7, item 5).
// É um retângulo que envolve os 39 municípios; quando o time fechar os valores, mude só aqui.

export const CAIXA_REGIAO = {
  latMin: -24.1,
  latMax: -23.15,
  lngMin: -47.1,
  lngMax: -45.75,
} as const;

/** Centro do mapa ao abrir: o centro da capital (distrito Sé). */
export const CENTRO_MAPA = { latitude: -23.55, longitude: -46.633 } as const;

/** Os 3 bairros da Av. Paulista, que foram o ponto de partida do projeto e seguem como lugares válidos. */
export type BairroPaulista = 'bela_vista' | 'cerqueira_cesar' | 'consolacao';

/** Centro aproximado de cada bairro da Paulista (provisório). */
export const CENTRO_BAIRRO: Record<BairroPaulista, { latitude: number; longitude: number }> = {
  bela_vista: { latitude: -23.5615, longitude: -46.6535 },
  cerqueira_cesar: { latitude: -23.565, longitude: -46.664 },
  consolacao: { latitude: -23.5545, longitude: -46.66 },
};

export const ESTACOES_METRO = [
  { nome: 'Consolação', latitude: -23.5581, longitude: -46.6606 },
  { nome: 'Trianon-Masp', latitude: -23.5613, longitude: -46.6563 },
  { nome: 'Brigadeiro', latitude: -23.5675, longitude: -46.6501 },
] as const;
