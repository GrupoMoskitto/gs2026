// Fila de relatos criados sem conexão. Ficam guardados no aparelho e são enviados quando a rede volta.
// Cada item tem uma chave de idempotência (Idempotency-Key): se o envio repetir, o servidor não duplica.
import type { NovoRelato, Relato } from '@/types/dominio';
import type { RelatoPendente } from '@/types/servicos';
import { chamarApi } from './http';
import { ehErroApi } from './erro';
import { lerJson, gravarJson } from './armazenamento';
import { ehRelato } from './tipos';

const CHAVE_FILA = 'fila';
const ouvintes = new Set<(fila: RelatoPendente[]) => void>();
let enviando = false;

/** Chave única para cada relato. Não precisa ser um UUID formal, só não repetir. */
export function gerarChave(): string {
  const parte = () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
  return `${Date.now().toString(16)}-${parte()}-${parte()}`;
}

export async function lerFila(): Promise<RelatoPendente[]> {
  const fila = await lerJson<RelatoPendente[]>(CHAVE_FILA);
  return Array.isArray(fila) ? fila : [];
}

async function salvarFila(fila: RelatoPendente[]): Promise<void> {
  await gravarJson(CHAVE_FILA, fila);
  ouvintes.forEach((ouvir) => ouvir(fila));
}

/** Avisa quando a fila muda. Devolve a função para parar de ouvir. */
export function assinarFila(ouvir: (fila: RelatoPendente[]) => void): () => void {
  ouvintes.add(ouvir);
  return () => {
    ouvintes.delete(ouvir);
  };
}

export async function entrarNaFila(novo: NovoRelato, chave: string = gerarChave()): Promise<RelatoPendente> {
  const pendente: RelatoPendente = { chave, novo, criadoEm: new Date().toISOString(), tentativas: 0 };
  const fila = await lerFila();
  await salvarFila([...fila, pendente]);
  return pendente;
}

export async function removerDaFila(chave: string): Promise<void> {
  const fila = await lerFila();
  await salvarFila(fila.filter((p) => p.chave !== chave));
}

export interface ResumoEnvio {
  enviados: Relato[];
  restantes: number;
}

/**
 * Tenta enviar tudo que está na fila, do mais antigo para o mais novo.
 * Para no primeiro erro de rede (não adianta insistir sem conexão).
 * Relato que o servidor recusa (400) sai da fila: repetir não vai mudar a resposta.
 */
export async function enviarFila(sinal?: AbortSignal): Promise<ResumoEnvio> {
  if (enviando) return { enviados: [], restantes: (await lerFila()).length };
  enviando = true;
  const enviados: Relato[] = [];
  try {
    let fila = await lerFila();
    for (const item of fila) {
      try {
        const resposta = await chamarApi('/api/relatos', {
          metodo: 'POST',
          corpo: item.novo,
          chaveIdempotencia: item.chave,
          sinal,
          novasTentativas: 1,
        });
        if (ehRelato(resposta)) enviados.push(resposta);
        fila = fila.filter((p) => p.chave !== item.chave);
        await salvarFila(fila);
      } catch (erro) {
        if (ehErroApi(erro) && erro.codigo === 'validacao') {
          fila = fila.filter((p) => p.chave !== item.chave);
          await salvarFila(fila);
          continue;
        }
        fila = fila.map((p) => (p.chave === item.chave ? { ...p, tentativas: p.tentativas + 1 } : p));
        await salvarFila(fila);
        break;
      }
    }
    return { enviados, restantes: fila.length };
  } finally {
    enviando = false;
  }
}
