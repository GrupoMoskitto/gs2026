// Textos mostrados à pessoa. Tudo em português, em frase (só a primeira letra maiúscula).
import type { FaixaHoraria, NivelRisco, StatusRelato, TipoRelato } from '@/types/dominio';

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
