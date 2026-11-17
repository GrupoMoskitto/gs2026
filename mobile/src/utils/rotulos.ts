import type { FaixaHoraria, NivelRisco, Origem, StatusRelato, TipoRelato } from '@/types/dominio';

export const ROTULO_TIPO: Record<TipoRelato, string> = {
  celular: 'Celular',
  bolsa_mochila: 'Bolsa ou mochila',
  veiculo: 'Veículo',
  bicicleta: 'Bicicleta',
  comercio: 'Comércio',
  outro: 'Outro',
};

export const ROTULO_FAIXA: Record<FaixaHoraria, string> = {
  madrugada: 'Madrugada',
  manha: 'Manhã',
  tarde: 'Tarde',
  noite: 'Noite',
};

/** Como aparece depois de "à" ou "de": "à noite", "de manhã" */
export const ROTULO_FAIXA_FRASE: Record<FaixaHoraria, string> = {
  madrugada: 'de madrugada',
  manha: 'de manhã',
  tarde: 'à tarde',
  noite: 'à noite',
};

export const HORAS_FAIXA: Record<FaixaHoraria, string> = {
  madrugada: '0h às 6h',
  manha: '6h às 12h',
  tarde: '12h às 18h',
  noite: '18h à 0h',
};

export const ROTULO_RISCO: Record<NivelRisco, string> = {
  baixo: 'Baixo',
  medio: 'Médio',
  alto: 'Alto',
};

export const ROTULO_STATUS: Record<StatusRelato, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

export const ROTULO_ORIGEM: Record<Origem, string> = {
  mobile: 'App',
  desktop: 'Moderação',
  iot: 'Botão de pânico',
};
