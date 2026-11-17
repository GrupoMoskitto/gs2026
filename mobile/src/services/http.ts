// Só repete o que é seguro: GET, PATCH e POST com chave de idempotência.
import { CONFIG_API } from '@/config/api';
import { ErroApi } from './erro';
import { calcularEspera, statusRepetivel } from './retry';

export type Metodo = 'GET' | 'POST' | 'PATCH';

export interface OpcoesHttp {
  metodo?: Metodo;
  corpo?: unknown;
  sinal?: AbortSignal;
  chaveIdempotencia?: string;
  novasTentativas?: number;
}

function podeRepetir(metodo: Metodo, chave: string | undefined): boolean {
  if (metodo === 'GET' || metodo === 'PATCH') return true;
  return chave !== undefined;
}

function esperar(ms: number, sinal?: AbortSignal): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    if (sinal?.aborted) {
      rejeitar(new ErroApi('cancelado', 'Chamada cancelada.'));
      return;
    }
    const temporizador = setTimeout(() => {
      sinal?.removeEventListener('abort', aoCancelar);
      resolver();
    }, ms);
    const aoCancelar = () => {
      clearTimeout(temporizador);
      rejeitar(new ErroApi('cancelado', 'Chamada cancelada.'));
    };
    sinal?.addEventListener('abort', aoCancelar, { once: true });
  });
}

async function tentar(url: string, opcoes: OpcoesHttp, metodo: Metodo): Promise<unknown> {
  const controle = new AbortController();
  let estourou = false;
  const temporizador = setTimeout(() => {
    estourou = true;
    controle.abort();
  }, CONFIG_API.tempoLimiteMs);
  const aoCancelar = () => controle.abort();
  opcoes.sinal?.addEventListener('abort', aoCancelar, { once: true });

  const cabecalhos: Record<string, string> = { Accept: 'application/json' };
  if (opcoes.corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (opcoes.chaveIdempotencia) cabecalhos['Idempotency-Key'] = opcoes.chaveIdempotencia;

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: cabecalhos,
      body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
      signal: controle.signal,
    });

    if (resposta.ok) {
      if (resposta.status === 204) return null;
      return (await resposta.json()) as unknown;
    }

    let mensagem = '';
    try {
      const corpo = (await resposta.json()) as { erro?: unknown };
      if (typeof corpo.erro === 'string') mensagem = corpo.erro;
    } catch {
    }
    if (resposta.status === 400 || resposta.status === 422) {
      throw new ErroApi('validacao', mensagem || 'Os dados enviados não foram aceitos.', resposta.status);
    }
    if (resposta.status === 404) {
      throw new ErroApi('nao_encontrado', mensagem || 'Não encontramos o que você procurou.', 404);
    }
    throw new ErroApi('servidor', mensagem || 'O servidor não conseguiu responder agora.', resposta.status);
  } catch (erro) {
    if (erro instanceof ErroApi) throw erro;
    if (opcoes.sinal?.aborted) throw new ErroApi('cancelado', 'Chamada cancelada.');
    if (estourou) throw new ErroApi('tempo_limite', 'A conexão está lenta. Tente de novo.');
    throw new ErroApi('rede', 'Sem conexão com o servidor.');
  } finally {
    clearTimeout(temporizador);
    opcoes.sinal?.removeEventListener('abort', aoCancelar);
  }
}

function repetivel(erro: ErroApi): boolean {
  if (erro.codigo === 'rede' || erro.codigo === 'tempo_limite') return true;
  return erro.codigo === 'servidor' && erro.status !== undefined && statusRepetivel(erro.status);
}

export async function chamarApi(caminho: string, opcoes: OpcoesHttp = {}): Promise<unknown> {
  if (CONFIG_API.baseUrl === '') throw new ErroApi('rede', 'A API ainda não foi configurada.');
  const metodo = opcoes.metodo ?? 'GET';
  const url = `${CONFIG_API.baseUrl}${caminho}`;
  const maximo = podeRepetir(metodo, opcoes.chaveIdempotencia)
    ? (opcoes.novasTentativas ?? CONFIG_API.novasTentativas)
    : 0;

  let tentativa = 0;
  for (;;) {
    try {
      return await tentar(url, opcoes, metodo);
    } catch (erro) {
      if (!(erro instanceof ErroApi) || !repetivel(erro) || tentativa >= maximo) throw erro;
      await esperar(calcularEspera(tentativa), opcoes.sinal);
      tentativa += 1;
    }
  }
}
