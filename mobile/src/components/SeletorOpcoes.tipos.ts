
export interface Opcao<T extends string> {
  id: T;
  rotulo: string;
}

export interface PropsSeletor<T extends string> {
  opcoes: readonly Opcao<T>[];
  valor: T | null;
  aoMudar: (id: T) => void;
  rotulo: string;
  estilo?: 'segmentado' | 'menu';
  textoVazio?: string;
}
