export const TIPOS_RELATO = ['celular', 'bolsa_mochila', 'veiculo', 'bicicleta', 'comercio', 'outro'] as const;
export type TipoRelato = (typeof TIPOS_RELATO)[number];

export type Bairro = string;

export const STATUS_RELATO = ['pendente', 'aprovado', 'rejeitado'] as const;
export type StatusRelato = (typeof STATUS_RELATO)[number];

export const ORIGENS = ['mobile', 'desktop', 'iot'] as const;
export type Origem = (typeof ORIGENS)[number];

export const FAIXAS_HORARIAS = ['madrugada', 'manha', 'tarde', 'noite'] as const;
export type FaixaHoraria = (typeof FAIXAS_HORARIAS)[number];

export const NIVEIS_RISCO = ['baixo', 'medio', 'alto'] as const;
export type NivelRisco = (typeof NIVEIS_RISCO)[number];

export interface Relato {
  id: string;
  tipo: TipoRelato;
  descricao?: string | null;
  latitude: number;
  longitude: number;
  bairro: Bairro;
  ocorrido_em: string;
  status: StatusRelato;
  origem: Origem;
}

export interface NovoRelato {
  tipo: TipoRelato;
  descricao?: string;
  latitude: number;
  longitude: number;
  bairro: Bairro;
  ocorrido_em: string;
  origem: 'mobile';
}

export interface PrevisaoRisco {
  bairro: Bairro;
  faixa_horaria: FaixaHoraria;
  nivel_risco: NivelRisco;
  score: number;
}

export interface Sessao {
  apelido: string;
  rm: string;
}

export const LIMITE_DESCRICAO = 280;
