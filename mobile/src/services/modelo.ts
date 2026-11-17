// Cópias de ia/data/previsoes.json e ia/data/resumo_modelo.json. Atualizar com: npm run modelo
import dados from '@/data/previsoes.json';
import resumo from '@/data/resumo_modelo.json';
import { FAIXAS_HORARIAS, type FaixaHoraria, type PrevisaoRisco } from '@/types/dominio';
import { ehPrevisao, filtrarLista } from './tipos';

type PorFaixa = number[];

export interface ResumoLugar {
  roubos: number;
  taxa: PorFaixa;
  celular: PorFaixa;
  veiculo: PorFaixa;
  mes?: PorFaixa;
}

export interface ResumoModelo {
  periodo: { inicio: string; fim: string };
  roubos: number;
  horas: number[];
  parte_noite: number;
  modelo: { f1: number; acuracia: number; f1_regra_simples: number };
  levados: { total: number; itens: { rotulo: string; parte: number }[] } | null;
  mes: { referencia: string; regiao: number; atraso: number } | null;
  lugares: Record<string, ResumoLugar>;
}

const DO_MODELO: readonly PrevisaoRisco[] = filtrarLista(dados, ehPrevisao) ?? [];
const RESUMO: ResumoModelo = resumo;

export function previsoesDoModelo(): PrevisaoRisco[] {
  return [...DO_MODELO];
}

export function resumoDoModelo(): ResumoModelo {
  return RESUMO;
}

/** Roubos por dia do lugar na faixa (último ano); 0 se o lugar não está no resumo. */
export function taxaNaFaixa(bairro: string, faixa: FaixaHoraria): number {
  return RESUMO.lugares[bairro]?.taxa[FAIXAS_HORARIAS.indexOf(faixa)] ?? 0;
}
