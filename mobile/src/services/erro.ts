import type { CodigoErro } from '@/types/servicos';

/** Erro de uma chamada à API. A mensagem já vem em português e pode ser mostrada à pessoa. */
export class ErroApi extends Error {
  readonly codigo: CodigoErro;
  readonly status?: number;

  constructor(codigo: CodigoErro, mensagem: string, status?: number) {
    super(mensagem);
    this.name = 'ErroApi';
    this.codigo = codigo;
    this.status = status;
  }
}

export function ehErroApi(erro: unknown): erro is ErroApi {
  return erro instanceof ErroApi;
}
