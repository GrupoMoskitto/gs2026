import type { FaixaHoraria, Origem, Relato, StatusRelato, TipoRelato } from '@/types/dominio';
import { faixaDoIso } from './tempo';

export const PERIODOS = [
  { id: 'tudo', rotulo: 'Qualquer data', horas: null },
  { id: '24h', rotulo: 'Últimas 24 horas', horas: 24 },
  { id: '7d', rotulo: 'Últimos 7 dias', horas: 24 * 7 },
  { id: '30d', rotulo: 'Últimos 30 dias', horas: 24 * 30 },
] as const;

export type Periodo = (typeof PERIODOS)[number]['id'];

export interface FiltrosRelatos {
  tipos: TipoRelato[];
  status: StatusRelato[];
  faixas: FaixaHoraria[];
  origens: Origem[];
  periodo: Periodo;
}

export const SEM_FILTROS: FiltrosRelatos = { tipos: [], status: [], faixas: [], origens: [], periodo: 'tudo' };

export function contarFiltros(f: FiltrosRelatos): number {
  return f.tipos.length + f.status.length + f.faixas.length + f.origens.length + (f.periodo === 'tudo' ? 0 : 1);
}

/** Lista vazia num grupo quer dizer "todos" daquele grupo. */
export function aplicarFiltros(relatos: readonly Relato[], f: FiltrosRelatos, agora: Date = new Date()): Relato[] {
  const horas = PERIODOS.find((p) => p.id === f.periodo)?.horas ?? null;
  const desde = horas === null ? null : agora.getTime() - horas * 3600000;
  return relatos.filter(
    (r) =>
      (f.tipos.length === 0 || f.tipos.includes(r.tipo)) &&
      (f.status.length === 0 || f.status.includes(r.status)) &&
      (f.origens.length === 0 || f.origens.includes(r.origem)) &&
      (f.faixas.length === 0 || f.faixas.includes(faixaDoIso(r.ocorrido_em))) &&
      (desde === null || new Date(r.ocorrido_em).getTime() >= desde),
  );
}
