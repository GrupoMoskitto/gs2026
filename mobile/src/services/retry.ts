// Cálculo da espera entre tentativas (backoff exponencial com jitter). Sem React: dá para testar no Node.
import { CONFIG_API } from '@/config/api';

/**
 * Espera antes da tentativa seguinte, em milissegundos.
 * `tentativa` começa em 0 (a espera depois da primeira falha).
 * `aleatorio` é um número de 0 a 1; vem de fora para o teste ser previsível.
 *
 * O jitter ("variação aleatória") sorteia entre metade e o total da espera, para que vários
 * celulares que perderam a conexão juntos não tentem de novo todos no mesmo instante.
 */
export function calcularEspera(
  tentativa: number,
  aleatorio: number = Math.random(),
  base: number = CONFIG_API.esperaBaseMs,
  maximo: number = CONFIG_API.esperaMaximaMs,
): number {
  const exponencial = Math.min(maximo, base * 2 ** tentativa);
  return Math.round(exponencial * (0.5 + 0.5 * aleatorio));
}

/** Códigos HTTP em que vale tentar de novo: o servidor falhou ou está ocupado. */
export function statusRepetivel(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}
