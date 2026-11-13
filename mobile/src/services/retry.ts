import { CONFIG_API } from '@/config/api';

/**
 * Espera antes da próxima tentativa, em ms. `aleatorio` (0 a 1) vem de fora para o teste ser previsível.
 * O jitter sorteia entre metade e o total da espera, para vários celulares não tentarem todos ao mesmo tempo.
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

export function statusRepetivel(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}
