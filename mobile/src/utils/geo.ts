// Funções de geografia, sem React: dá para testar no Node.
import { LUGARES } from '@/config/locais';
import { CAIXA_REGIAO } from '@/config/regiao';
import type { Bairro } from '@/types/dominio';

export interface Ponto {
  latitude: number;
  longitude: number;
}

/** Arredonda para 3 casas decimais (cerca de 100 m), para não expor o endereço exato. */
export function arredondar3(valor: number): number {
  return Math.round(valor * 1000) / 1000;
}

export function dentroDaRegiao(p: Ponto): boolean {
  return (
    p.latitude >= CAIXA_REGIAO.latMin &&
    p.latitude <= CAIXA_REGIAO.latMax &&
    p.longitude >= CAIXA_REGIAO.lngMin &&
    p.longitude <= CAIXA_REGIAO.lngMax
  );
}

/** Distância aproximada em metros (fórmula de haversine). */
export function distanciaMetros(a: Ponto, b: Ponto): number {
  const raioTerra = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * raioTerra * Math.asin(Math.sqrt(h));
}

/** Código do lugar (distrito ou município) cujo centro está mais perto do ponto. Aproximado: não usa os limites reais. */
export function bairroMaisProximo(p: Ponto): Bairro {
  let melhor = LUGARES[0];
  let menor = Number.POSITIVE_INFINITY;
  for (const lugar of LUGARES) {
    const d = distanciaMetros(p, lugar);
    if (d < menor) {
      menor = d;
      melhor = lugar;
    }
  }
  return melhor.slug;
}
