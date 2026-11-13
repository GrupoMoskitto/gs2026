// Contrato da camada de serviços (src/services). A interface gráfica só fala com isso.
import type { Bairro, NovoRelato, Relato, StatusRelato, TipoRelato } from './dominio';

/** De onde veio o dado mostrado: API de verdade, cópia salva no aparelho ou dados de exemplo. */
export type FonteDados = 'api' | 'cache' | 'exemplo';

export interface Resultado<T> {
  dados: T;
  fonte: FonteDados;
  /** ISO 8601 de quando o dado foi obtido */
  atualizadoEm: string;
}

export type CodigoErro = 'rede' | 'tempo_limite' | 'servidor' | 'validacao' | 'nao_encontrado' | 'cancelado';

export interface OpcoesChamada {
  /** Para cancelar a chamada ao sair da tela */
  sinal?: AbortSignal;
}

export interface FiltroRelatos {
  bairro?: Bairro;
  tipo?: TipoRelato;
  status?: StatusRelato;
}

/** Relato criado sem conexão, esperando na fila do aparelho. */
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
  /** Mensagens em português, por campo: { tipo: 'Escolha o tipo do relato.' } */
  | { ok: false; erros: Record<string, string> };
