import {
  FAIXAS_HORARIAS,
  NIVEIS_RISCO,
  ORIGENS,
  STATUS_RELATO,
  TIPOS_RELATO,
  type PrevisaoRisco,
  type Relato,
} from '@/types/dominio';

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function entre<T extends string>(lista: readonly T[], valor: unknown): valor is T {
  return typeof valor === 'string' && (lista as readonly string[]).includes(valor);
}

/** O código do lugar é um texto não vazio; a lista completa muda com a API, então o app não a confere aqui. */
function ehCodigoDeLugar(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim() !== '';
}

export function ehRelato(valor: unknown): valor is Relato {
  return (
    ehObjeto(valor) &&
    typeof valor.id === 'string' &&
    entre(TIPOS_RELATO, valor.tipo) &&
    typeof valor.latitude === 'number' &&
    typeof valor.longitude === 'number' &&
    ehCodigoDeLugar(valor.bairro) &&
    typeof valor.ocorrido_em === 'string' &&
    entre(STATUS_RELATO, valor.status) &&
    entre(ORIGENS, valor.origem) &&
    (valor.descricao === undefined || valor.descricao === null || typeof valor.descricao === 'string')
  );
}

export function ehPrevisao(valor: unknown): valor is PrevisaoRisco {
  return (
    ehObjeto(valor) &&
    ehCodigoDeLugar(valor.bairro) &&
    entre(FAIXAS_HORARIAS, valor.faixa_horaria) &&
    entre(NIVEIS_RISCO, valor.nivel_risco) &&
    typeof valor.score === 'number'
  );
}

export function filtrarLista<T>(valor: unknown, confere: (item: unknown) => item is T): T[] | null {
  if (!Array.isArray(valor)) return null;
  return valor.filter(confere);
}
