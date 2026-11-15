import { API_CONFIGURADA } from '@/config/api';
import type { Bairro, FaixaHoraria, PrevisaoRisco } from '@/types/dominio';
import type { OpcoesChamada, Resultado } from '@/types/servicos';
import { ehErroApi, ErroApi } from './erro';
import { gravarCache, lerCache } from './armazenamento';
import { chamarApi } from './http';
import { previsoesDoModelo } from './modelo';
import { ehPrevisao, filtrarLista } from './tipos';

const CHAVE = 'previsoes';

export async function listarPrevisoes(
  bairro?: Bairro,
  opcoes: OpcoesChamada = {},
): Promise<Resultado<PrevisaoRisco[]>> {
  if (API_CONFIGURADA) {
    try {
      const consulta = bairro ? `?bairro=${encodeURIComponent(bairro)}` : '';
      const resposta = await chamarApi(`/api/previsoes${consulta}`, { sinal: opcoes.sinal });
      const lista = filtrarLista(resposta, ehPrevisao);
      if (lista === null) throw new ErroApi('servidor', 'A resposta do servidor veio num formato inesperado.');
      if (!bairro) await gravarCache(CHAVE, lista);
      return { dados: lista, fonte: 'api', atualizadoEm: new Date().toISOString() };
    } catch (erro) {
      if (ehErroApi(erro) && erro.codigo === 'cancelado') throw erro;
      const salvo = await lerCache<PrevisaoRisco[]>(CHAVE);
      if (salvo) {
        const dados = bairro ? salvo.dados.filter((p) => p.bairro === bairro) : salvo.dados;
        return { dados, fonte: 'cache', atualizadoEm: salvo.salvoEm };
      }
    }
  }
  const todas = previsoesDoModelo();
  const dados = bairro ? todas.filter((p) => p.bairro === bairro) : todas;
  return { dados, fonte: 'modelo', atualizadoEm: new Date().toISOString() };
}

export function riscoDe(previsoes: PrevisaoRisco[], bairro: Bairro, faixa: FaixaHoraria): PrevisaoRisco | null {
  return previsoes.find((p) => p.bairro === bairro && p.faixa_horaria === faixa) ?? null;
}
