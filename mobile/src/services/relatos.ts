import { API_CONFIGURADA } from '@/config/api';
import type { NovoRelato, Relato } from '@/types/dominio';
import type {
  FiltroRelatos,
  OpcoesChamada,
  Resultado,
  ResultadoEnvio,
} from '@/types/servicos';
import { ehErroApi, ErroApi } from './erro';
import { gravarCache, lerCache } from './armazenamento';
import { entrarNaFila, gerarChave } from './fila';
import { gerarRelatosExemplo } from './exemplos';
import { chamarApi } from './http';
import { ehRelato, filtrarLista } from './tipos';

const QUANTIDADE_EXEMPLO = 220;

function chaveCache(filtro: FiltroRelatos): string {
  return `relatos:${filtro.bairro ?? '-'}:${filtro.tipo ?? '-'}:${filtro.status ?? '-'}`;
}

function montarConsulta(filtro: FiltroRelatos): string {
  const partes: string[] = [];
  if (filtro.bairro) partes.push(`bairro=${encodeURIComponent(filtro.bairro)}`);
  if (filtro.tipo) partes.push(`tipo=${encodeURIComponent(filtro.tipo)}`);
  if (filtro.status) partes.push(`status=${encodeURIComponent(filtro.status)}`);
  return partes.length > 0 ? `?${partes.join('&')}` : '';
}

function aplicarFiltro(lista: Relato[], filtro: FiltroRelatos): Relato[] {
  return lista.filter(
    (r) =>
      (filtro.bairro === undefined || r.bairro === filtro.bairro) &&
      (filtro.tipo === undefined || r.tipo === filtro.tipo) &&
      (filtro.status === undefined || r.status === filtro.status),
  );
}

export async function listarRelatos(
  filtro: FiltroRelatos = {},
  opcoes: OpcoesChamada = {},
): Promise<Resultado<Relato[]>> {
  if (API_CONFIGURADA) {
    try {
      const resposta = await chamarApi(`/api/relatos${montarConsulta(filtro)}`, { sinal: opcoes.sinal });
      const lista = filtrarLista(resposta, ehRelato);
      if (lista === null) throw new ErroApi('servidor', 'A resposta do servidor veio num formato inesperado.');
      await gravarCache(chaveCache(filtro), lista);
      return { dados: lista, fonte: 'api', atualizadoEm: new Date().toISOString() };
    } catch (erro) {
      if (ehErroApi(erro) && erro.codigo === 'cancelado') throw erro;
      const salvo = await lerCache<Relato[]>(chaveCache(filtro));
      if (salvo) return { dados: salvo.dados, fonte: 'cache', atualizadoEm: salvo.salvoEm };
    }
  }
  const exemplo = aplicarFiltro(gerarRelatosExemplo(QUANTIDADE_EXEMPLO), filtro);
  return { dados: exemplo, fonte: 'exemplo', atualizadoEm: new Date().toISOString() };
}

export async function obterRelato(id: string, opcoes: OpcoesChamada = {}): Promise<Resultado<Relato>> {
  if (API_CONFIGURADA) {
    try {
      const resposta = await chamarApi(`/api/relatos/${encodeURIComponent(id)}`, { sinal: opcoes.sinal });
      if (!ehRelato(resposta)) throw new ErroApi('servidor', 'A resposta do servidor veio num formato inesperado.');
      return { dados: resposta, fonte: 'api', atualizadoEm: new Date().toISOString() };
    } catch (erro) {
      if (ehErroApi(erro) && (erro.codigo === 'cancelado' || erro.codigo === 'nao_encontrado')) throw erro;
      const salvo = await lerCache<Relato[]>(chaveCache({}));
      const achado = salvo?.dados.find((r) => r.id === id);
      if (salvo && achado) return { dados: achado, fonte: 'cache', atualizadoEm: salvo.salvoEm };
    }
  }
  const exemplo = gerarRelatosExemplo(QUANTIDADE_EXEMPLO).find((r) => r.id === id);
  if (!exemplo) throw new ErroApi('nao_encontrado', 'Não encontramos esse relato.');
  return { dados: exemplo, fonte: 'exemplo', atualizadoEm: new Date().toISOString() };
}

/** Sem conexão, o relato vai para a fila do aparelho; só uma recusa do servidor (400) volta como erro. */
export async function criarRelato(novo: NovoRelato, opcoes: OpcoesChamada = {}): Promise<ResultadoEnvio> {
  const chave = gerarChave();
  try {
    const resposta = await chamarApi('/api/relatos', {
      metodo: 'POST',
      corpo: novo,
      chaveIdempotencia: chave,
      sinal: opcoes.sinal,
    });
    if (!ehRelato(resposta)) throw new ErroApi('servidor', 'A resposta do servidor veio num formato inesperado.');
    return { tipo: 'enviado', relato: resposta };
  } catch (erro) {
    if (ehErroApi(erro) && (erro.codigo === 'validacao' || erro.codigo === 'cancelado')) throw erro;
    const pendente = await entrarNaFila(novo, chave);
    return { tipo: 'na_fila', pendente };
  }
}
