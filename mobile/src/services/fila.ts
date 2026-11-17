import type { NovoRelato, Relato } from '@/types/dominio';
import type { RelatoPendente } from '@/types/servicos';
import { chamarApi } from './http';
import { ehErroApi, ErroApi } from './erro';
import { lerJson, gravarJson } from './armazenamento';
import { ehRelato } from './tipos';

const CHAVE_FILA = 'fila';
const ouvintes = new Set<(fila: RelatoPendente[]) => void>();
let envioAtual: Promise<ResumoEnvio> | null = null;

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
  recusados: number;
  motivoRecusa: string | null;
  erro: ErroApi | null;
}

/** Para no primeiro erro de rede; relato recusado (400) sai da fila. */
export function enviarFila(sinal?: AbortSignal): Promise<ResumoEnvio> {
  envioAtual ??= enviar(sinal).finally(() => {
    envioAtual = null;
  });
  return envioAtual;
}

async function enviar(sinal?: AbortSignal): Promise<ResumoEnvio> {
  const enviados: Relato[] = [];
  let recusados = 0;
  let motivoRecusa: string | null = null;
  let erroEnvio: ErroApi | null = null;
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
          recusados += 1;
          motivoRecusa = erro.message;
          fila = fila.filter((p) => p.chave !== item.chave);
          await salvarFila(fila);
          continue;
        }
        erroEnvio = ehErroApi(erro) ? erro : new ErroApi('servidor', 'Não foi possível enviar agora.');
        fila = fila.map((p) => (p.chave === item.chave ? { ...p, tentativas: p.tentativas + 1 } : p));
        await salvarFila(fila);
        break;
      }
    }
    return { enviados, restantes: fila.length, recusados, motivoRecusa, erro: erroEnvio };
  } catch {
    return { enviados, restantes: (await lerFila()).length, recusados, motivoRecusa, erro: new ErroApi('servidor', 'Não foi possível enviar agora.') };
  }
}
