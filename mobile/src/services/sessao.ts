import type { Sessao } from '@/types/dominio';
import { gravarJson, lerJson, removerChave } from './armazenamento';

const CHAVE = 'sessao';

export async function lerSessao(): Promise<Sessao | null> {
  const salva = await lerJson<Partial<Sessao>>(CHAVE);
  if (salva && typeof salva.apelido === 'string' && typeof salva.rm === 'string') {
    return { apelido: salva.apelido, rm: salva.rm };
  }
  return null;
}

export async function gravarSessao(sessao: Sessao): Promise<void> {
  await gravarJson(CHAVE, sessao);
}

export async function limparSessao(): Promise<void> {
  await removerChave(CHAVE);
}
