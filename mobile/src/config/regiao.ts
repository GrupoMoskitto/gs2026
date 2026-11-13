// Região do projeto: Região Metropolitana de São Paulo (capital por distritos, demais cidades por município).
// PROVISÓRIO: a caixa de coordenadas ainda é decisão em aberto (AGENTS.md, seção 7, item 5). Mude só aqui.

export const CAIXA_REGIAO = {
  latMin: -24.1,
  latMax: -23.15,
  lngMin: -47.1,
  lngMax: -45.75,
} as const;

export const CENTRO_MAPA = { latitude: -23.55, longitude: -46.633 } as const;

export type BairroPaulista = 'bela_vista' | 'cerqueira_cesar' | 'consolacao';

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
