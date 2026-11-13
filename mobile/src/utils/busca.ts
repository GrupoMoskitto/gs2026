// Busca de lugares por nome, sem diferença de maiúsculas e acentos ("consolacao" acha "Consolação").
import type { TipoLocal } from '@/config/locais';

/** Tira acentos, passa para minúsculas e apara os espaços. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Em empate, o que é do projeto vem antes do que é da região.
const PRIORIDADE: Record<TipoLocal, number> = { bairro: 0, estacao: 1, distrito: 2, municipio: 3 };

/**
 * Devolve até `limite` lugares. Quem começa com o texto vem primeiro, depois quem tem uma palavra
 * começando com ele, depois quem apenas contém. Texto vazio não devolve nada.
 */
export function buscarLocais<T extends { nome: string; tipo: TipoLocal }>(locais: readonly T[], texto: string, limite = 6): T[] {
  const termo = normalizar(texto);
  if (termo === '') return [];

  const pontuados: { local: T; nota: number; nome: string }[] = [];
  for (const local of locais) {
    const nome = normalizar(local.nome);
    let nota: number;
    if (nome.startsWith(termo)) nota = 0;
    else if (nome.split(/[\s-]+/).some((palavra) => palavra.startsWith(termo))) nota = 1;
    else if (nome.includes(termo)) nota = 2;
    else continue;
    pontuados.push({ local, nota, nome });
  }

  pontuados.sort(
    (a, b) => a.nota - b.nota || PRIORIDADE[a.local.tipo] - PRIORIDADE[b.local.tipo] || a.nome.localeCompare(b.nome, 'pt-BR'),
  );
  return pontuados.slice(0, limite).map((p) => p.local);
}
