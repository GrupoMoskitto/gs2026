// Validação do formulário de novo relato. Sem React: dá para testar no Node.
// As mesmas regras valem na API (AGENTS.md, seção 4): a validação do app é só para avisar cedo.
import { lugarDe } from '@/config/locais';
import { CAIXA_REGIAO } from '@/config/regiao';
import {
  LIMITE_DESCRICAO,
  TIPOS_RELATO,
  type Bairro,
  type NovoRelato,
  type TipoRelato,
} from '@/types/dominio';
import type { ResultadoValidacao } from '@/types/servicos';
import { arredondar3, dentroDaRegiao } from './geo';
import { isoSaoPaulo } from './tempo';

export interface EntradaRelato {
  tipo: TipoRelato | null;
  bairro: Bairro | null;
  descricao: string;
  latitude: number | null;
  longitude: number | null;
  /** Quando aconteceu */
  ocorridoEm: Date;
}

const DIAS_MAXIMOS_ATRAS = 30;
const FOLGA_FUTURO_MS = 5 * 60 * 1000;

export function validarNovoRelato(
  entrada: EntradaRelato,
  agora: Date = new Date(),
): ResultadoValidacao<NovoRelato> {
  const erros: Record<string, string> = {};

  if (entrada.tipo === null || !TIPOS_RELATO.includes(entrada.tipo)) {
    erros.tipo = 'Escolha o tipo do relato.';
  }
  if (entrada.bairro === null || lugarDe(entrada.bairro) === null) {
    erros.bairro = 'Escolha o local.';
  }

  const descricao = entrada.descricao.trim();
  if (descricao.length > LIMITE_DESCRICAO) {
    erros.descricao = `A descrição pode ter até ${LIMITE_DESCRICAO} caracteres.`;
  }

  if (entrada.latitude === null || entrada.longitude === null) {
    erros.local = 'Informe o local: use a sua localização ou escolha o local.';
  } else if (!dentroDaRegiao({ latitude: entrada.latitude, longitude: entrada.longitude })) {
    erros.local =
      `O local precisa estar na região metropolitana de São Paulo ` +
      `(latitude de ${CAIXA_REGIAO.latMin} a ${CAIXA_REGIAO.latMax}).`;
  }

  const ms = entrada.ocorridoEm.getTime();
  if (Number.isNaN(ms)) {
    erros.quando = 'Informe quando aconteceu.';
  } else if (ms > agora.getTime() + FOLGA_FUTURO_MS) {
    erros.quando = 'O horário não pode ser no futuro.';
  } else if (ms < agora.getTime() - DIAS_MAXIMOS_ATRAS * 86400000) {
    erros.quando = `Só aceitamos relatos dos últimos ${DIAS_MAXIMOS_ATRAS} dias.`;
  }

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  // Aqui os campos já foram checados; os testes abaixo só estreitam os tipos para o compilador.
  if (entrada.tipo === null || entrada.bairro === null || entrada.latitude === null || entrada.longitude === null) {
    return { ok: false, erros: { local: 'Preencha todos os campos.' } };
  }

  const novo: NovoRelato = {
    tipo: entrada.tipo,
    bairro: entrada.bairro,
    latitude: arredondar3(entrada.latitude),
    longitude: arredondar3(entrada.longitude),
    ocorrido_em: isoSaoPaulo(entrada.ocorridoEm),
    origem: 'mobile',
    ...(descricao.length > 0 ? { descricao } : {}),
  };
  return { ok: true, valor: novo };
}

/** Validação do apelido e do RM na tela de identificação. */
export function validarIdentificacao(
  apelido: string,
  rm: string,
): ResultadoValidacao<{ apelido: string; rm: string }> {
  const erros: Record<string, string> = {};
  const a = apelido.trim();
  const r = rm.trim().toUpperCase().replace(/^RM\s*/, '');

  if (a.length < 2) erros.apelido = 'Digite um apelido com pelo menos 2 letras.';
  else if (a.length > 24) erros.apelido = 'O apelido pode ter até 24 caracteres.';

  if (!/^\d{6}$/.test(r)) erros.rm = 'O RM tem 6 números. Exemplo: 559579.';

  if (Object.keys(erros).length > 0) return { ok: false, erros };
  return { ok: true, valor: { apelido: a, rm: `RM${r}` } };
}
