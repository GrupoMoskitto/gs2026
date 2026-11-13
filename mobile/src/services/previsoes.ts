// Previsões de risco (GET /api/previsoes). Mesma ordem de tentativa dos relatos: API, cópia salva, exemplo.
import { API_CONFIGURADA } from '@/config/api';
import type { Bairro, FaixaHoraria, NivelRisco, PrevisaoRisco } from '@/types/dominio';
import type { OpcoesChamada, Resultado } from '@/types/servicos';
import { ehErroApi, ErroApi } from './erro';
import { gravarCache, lerCache } from './armazenamento';
import { gerarPrevisoesExemplo } from './exemplos';
import { chamarApi } from './http';
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
  const todas = gerarPrevisoesExemplo();
  const dados = bairro ? todas.filter((p) => p.bairro === bairro) : todas;
  return { dados, fonte: 'exemplo', atualizadoEm: new Date().toISOString() };
}

/** Nível de risco de um bairro numa faixa. Sem previsão, devolve null (a tela mostra "sem dados"). */
export function riscoDe(previsoes: PrevisaoRisco[], bairro: Bairro, faixa: FaixaHoraria): PrevisaoRisco | null {
  return previsoes.find((p) => p.bairro === bairro && p.faixa_horaria === faixa) ?? null;
}

/** Ordem para achar o pior bairro: alto vem antes de médio e de baixo. */
const PESO_NIVEL: Record<NivelRisco, number> = { baixo: 0, medio: 1, alto: 2 };

/** Bairro de maior risco numa faixa (desempata pelo score). */
export function piorBairro(previsoes: PrevisaoRisco[], faixa: FaixaHoraria): PrevisaoRisco | null {
  const dessaFaixa = previsoes.filter((p) => p.faixa_horaria === faixa);
  if (dessaFaixa.length === 0) return null;
  return dessaFaixa.reduce((a, b) => {
    if (PESO_NIVEL[b.nivel_risco] !== PESO_NIVEL[a.nivel_risco]) {
      return PESO_NIVEL[b.nivel_risco] > PESO_NIVEL[a.nivel_risco] ? b : a;
    }
    return b.score > a.score ? b : a;
  });
}
