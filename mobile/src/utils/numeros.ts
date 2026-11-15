export function formatarInteiro(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatarDecimal(n: number, casas = 1): string {
  return n.toFixed(casas).replace('.', ',');
}

export function formatarParte(parte: number): string {
  return `${Math.round(parte * 100)}%`;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-11" → "novembro de 2026" */
export function mesPorExtenso(anoMes: string): string {
  const [ano, mes] = anoMes.split('-').map(Number);
  return `${MESES[mes - 1]} de ${ano}`;
}

/** "2024-01-01" → "jan/2024" */
export function mesCurto(data: string): string {
  const [ano, mes] = data.split('-').map(Number);
  return `${MESES[mes - 1].slice(0, 3)}/${ano}`;
}
