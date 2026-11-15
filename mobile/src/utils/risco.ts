import { FAIXAS_HORARIAS, NIVEIS_RISCO, type FaixaHoraria, type NivelRisco, type PrevisaoRisco } from '@/types/dominio';

export function contarNiveis(previsoes: PrevisaoRisco[], faixa: FaixaHoraria): Record<NivelRisco, number> {
  const contagem: Record<NivelRisco, number> = { baixo: 0, medio: 0, alto: 0 };
  for (const p of previsoes) if (p.faixa_horaria === faixa) contagem[p.nivel_risco] += 1;
  return contagem;
}

/** Ordena pelo nível, depois pela nota e, no empate, pelo desempate (ex.: roubos por dia). */
export function maioresRiscos(
  previsoes: PrevisaoRisco[],
  faixa: FaixaHoraria,
  quantos: number,
  desempate: (bairro: string) => number = () => 0,
): PrevisaoRisco[] {
  const peso = (n: NivelRisco) => NIVEIS_RISCO.indexOf(n);
  return previsoes
    .filter((p) => p.faixa_horaria === faixa)
    .sort((a, b) => peso(b.nivel_risco) - peso(a.nivel_risco) || b.score - a.score || desempate(b.bairro) - desempate(a.bairro))
    .slice(0, quantos);
}

/** Faixa com o maior e com o menor valor (empate fica com a primeira do dia). */
export function extremos(valores: number[]): { maior: FaixaHoraria; menor: FaixaHoraria } {
  let maior = 0;
  let menor = 0;
  valores.forEach((v, i) => {
    if (v > valores[maior]) maior = i;
    if (v < valores[menor]) menor = i;
  });
  return { maior: FAIXAS_HORARIAS[maior], menor: FAIXAS_HORARIAS[menor] };
}

export function horaDePico(horas: number[]): number {
  return horas.reduce((pico, v, h) => (v > horas[pico] ? h : pico), 0);
}

/** 20 → "20h às 21h"; 0 → "0h à 1h"; 23 → "23h à 0h" */
export function rotuloDaHora(hora: number): string {
  const fim = (hora + 1) % 24;
  return `${hora}h ${fim <= 1 ? 'à' : 'às'} ${fim}h`;
}
