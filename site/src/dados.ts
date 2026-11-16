import lugaresJson from './data/lugares.json';
import previsoesJson from './data/previsoes.json';
import resumoJson from './data/resumo_modelo.json';

export const FAIXAS = ['madrugada', 'manha', 'tarde', 'noite'] as const;
export type Faixa = (typeof FAIXAS)[number];
export type Nivel = 'baixo' | 'medio' | 'alto';

export interface Lugar {
  codigo: string;
  nome: string;
  tipo: string;
  lat: number;
  lng: number;
}
export interface Previsao {
  bairro: string;
  faixa_horaria: Faixa;
  nivel_risco: Nivel;
  score: number;
}
interface ResumoLugar {
  roubos: number;
  taxa: number[];
  celular: number[];
  veiculo: number[];
  mes?: number[];
}

export const LUGARES = lugaresJson as Lugar[];
export const RESUMO = resumoJson as typeof resumoJson & {
  lugares: Record<string, ResumoLugar>;
};
const PREVISOES = previsoesJson as Previsao[];
const POR_CHAVE = new Map(PREVISOES.map((p) => [`${p.bairro}|${p.faixa_horaria}`, p]));

export const ROTULO_FAIXA: Record<Faixa, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};
export const HORAS_FAIXA: Record<Faixa, string> = {
  madrugada: '0h às 6h',
  manha: '6h às 12h',
  tarde: '12h às 18h',
  noite: '18h à 0h',
};
export const NA_FAIXA: Record<Faixa, string> = {
  madrugada: 'de madrugada',
  manha: 'de manhã',
  tarde: 'à tarde',
  noite: 'à noite',
};
export const ROTULO_NIVEL: Record<Nivel, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
};
export const COR_NIVEL: Record<Nivel, string> = {
  baixo: '#2E8B6A',
  medio: '#D99A00',
  alto: '#C73A2E',
};
export const ROTULO_TIPO: Record<string, string> = {
  bairro: 'Bairro da Av. Paulista',
  distrito: 'Distrito de São Paulo',
  municipio: 'Município da região metropolitana',
};

export const faixaDeAgora = (d = new Date()): Faixa => FAIXAS[Math.floor(d.getHours() / 6)];
export const nivelDe = (codigo: string, faixa: Faixa): Nivel => POR_CHAVE.get(`${codigo}|${faixa}`)?.nivel_risco ?? 'baixo';
export const previsaoDe = (codigo: string, faixa: Faixa): Previsao | undefined => POR_CHAVE.get(`${codigo}|${faixa}`);
export const taxaDe = (codigo: string, faixa: Faixa): number => RESUMO.lugares[codigo]?.taxa[FAIXAS.indexOf(faixa)] ?? 0;

export function contarNiveis(faixa: Faixa): Record<Nivel, number> {
  const c = { baixo: 0, medio: 0, alto: 0 };
  for (const l of LUGARES) c[nivelDe(l.codigo, faixa)] += 1;
  return c;
}

const PESO: Record<Nivel, number> = { baixo: 0, medio: 1, alto: 2 };
export function maioresRiscos(faixa: Faixa, quantos: number): Lugar[] {
  return [...LUGARES]
    .sort((a, b) => PESO[nivelDe(b.codigo, faixa)] - PESO[nivelDe(a.codigo, faixa)] || taxaDe(b.codigo, faixa) - taxaDe(a.codigo, faixa))
    .slice(0, quantos);
}

export const inteiro = (n: number) => Math.round(n).toLocaleString('pt-BR');
export const decimal = (n: number) =>
  n.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
export const parte = (n: number) => `${Math.round(n * 100)}%`;

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const mesPorExtenso = (ref: string) => `${MESES[Number(ref.slice(5, 7)) - 1]} de ${ref.slice(0, 4)}`;

export const REPO = 'https://github.com/GrupoMoskitto/gs2026';
