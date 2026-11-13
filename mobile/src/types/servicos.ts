import type { Bairro, NovoRelato, Relato, StatusRelato, TipoRelato } from './dominio';

export type FonteDados = 'api' | 'cache' | 'exemplo';

export interface Resultado<T> {
  dados: T;
  fonte: FonteDados;
  atualizadoEm: string;
}

export type CodigoErro = 'rede' | 'tempo_limite' | 'servidor' | 'validacao' | 'nao_encontrado' | 'cancelado';

export interface OpcoesChamada {
  sinal?: AbortSignal;
}

export interface FiltroRelatos {
  bairro?: Bairro;
  tipo?: TipoRelato;
  status?: StatusRelato;
}

export interface RelatoPendente {
  /** Chave de idempotência (Idempotency-Key): evita duplicar o relato ao repetir o envio */
  chave: string;
  novo: NovoRelato;
  criadoEm: string;
  tentativas: number;
}

export type ResultadoEnvio =
  | { tipo: 'enviado'; relato: Relato }
  | { tipo: 'na_fila'; pendente: RelatoPendente };

export type ResultadoValidacao<T> =
  | { ok: true; valor: T }
  | { ok: false; erros: Record<string, string> };
