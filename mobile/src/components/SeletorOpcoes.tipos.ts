// Tipos do seletor de opções, iguais nas duas plataformas.

export interface Opcao<T extends string> {
  id: T;
  rotulo: string;
}

export interface PropsSeletor<T extends string> {
  opcoes: readonly Opcao<T>[];
  /** null quando ainda não há escolha */
  valor: T | null;
  aoMudar: (id: T) => void;
  /** Nome do campo, lido pelo leitor de tela e usado como rótulo do menu */
  rotulo: string;
  /** "segmentado" mostra todas as opções lado a lado (até 3 ou 4 curtas); "menu" abre uma lista. */
  estilo?: 'segmentado' | 'menu';
  /** Texto do menu enquanto nada foi escolhido */
  textoVazio?: string;
}
