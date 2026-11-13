// Datas e horários no fuso de São Paulo (UTC-3, sem horário de verão desde 2019).
// Sem React nem bibliotecas: dá para testar no Node.
import type { FaixaHoraria } from '@/types/dominio';

const DESLOCAMENTO_MS = -3 * 60 * 60 * 1000;

const dois = (n: number) => String(n).padStart(2, '0');

/** Data e hora de parede em São Paulo, como números. */
function partesSp(data: Date) {
  const sp = new Date(data.getTime() + DESLOCAMENTO_MS);
  return {
    ano: sp.getUTCFullYear(),
    mes: sp.getUTCMonth() + 1,
    dia: sp.getUTCDate(),
    hora: sp.getUTCHours(),
    minuto: sp.getUTCMinutes(),
    diaSemana: sp.getUTCDay(),
  };
}

/** ISO 8601 com fuso, como a API espera: 2026-11-10T21:35:00-03:00 */
export function isoSaoPaulo(data: Date): string {
  const p = partesSp(data);
  return `${p.ano}-${dois(p.mes)}-${dois(p.dia)}T${dois(p.hora)}:${dois(p.minuto)}:00-03:00`;
}

export function faixaDaHora(hora: number): FaixaHoraria {
  if (hora < 6) return 'madrugada';
  if (hora < 12) return 'manha';
  if (hora < 18) return 'tarde';
  return 'noite';
}

export function faixaAtual(agora: Date = new Date()): FaixaHoraria {
  return faixaDaHora(partesSp(agora).hora);
}

/** "21h35" */
export function formatarHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = partesSp(d);
  return `${p.hora}h${dois(p.minuto)}`;
}

/** "Hoje", "Ontem" ou "10/11" */
export function formatarDia(iso: string, agora: Date = new Date()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const a = partesSp(d);
  const h = partesSp(agora);
  const diaDe = (p: { ano: number; mes: number; dia: number }) => Date.UTC(p.ano, p.mes - 1, p.dia);
  const dif = Math.round((diaDe(h) - diaDe(a)) / 86400000);
  if (dif === 0) return 'Hoje';
  if (dif === 1) return 'Ontem';
  return `${dois(a.dia)}/${dois(a.mes)}`;
}

/** "Ontem, 21h35" */
export function formatarQuando(iso: string, agora: Date = new Date()): string {
  const dia = formatarDia(iso, agora);
  const hora = formatarHora(iso);
  return dia && hora ? `${dia}, ${hora}` : '';
}

/** Opções rápidas de "quando aconteceu", em minutos atrás. */
export const OPCOES_QUANDO = [
  { id: 'agora', rotulo: 'Agora', minutosAtras: 0 },
  { id: '1h', rotulo: '1 hora atrás', minutosAtras: 60 },
  { id: '3h', rotulo: '3 horas atrás', minutosAtras: 180 },
  { id: 'ontem', rotulo: 'Ontem', minutosAtras: 24 * 60 },
] as const;

export type IdQuando = (typeof OPCOES_QUANDO)[number]['id'];

export function dataDeOpcao(id: IdQuando, agora: Date = new Date()): Date {
  const opcao = OPCOES_QUANDO.find((o) => o.id === id);
  return new Date(agora.getTime() - (opcao?.minutosAtras ?? 0) * 60000);
}
