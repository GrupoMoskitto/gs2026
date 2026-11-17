// Valores de mockup/tokens.css.
import { Platform, useColorScheme } from 'react-native';

import type { NivelRisco, StatusRelato } from '@/types/dominio';

export interface Cores {
  fundo: string;
  superficie: string;
  superficie2: string;
  linha: string;
  texto: string;
  textoSuave: string;
  primaria: string;
  sobrePrimaria: string;
  primariaSuave: string;
  sobrePrimariaSuave: string;
  foco: string;
  vidro: string;
  vidroLinha: string;
  sucesso: string;
  sucessoSuave: string;
  sobreSucessoSuave: string;
  alerta: string;
  alertaSuave: string;
  sobreAlertaSuave: string;
  perigo: string;
  perigoSuave: string;
  sobrePerigoSuave: string;
  metro: string;
  eu: string;
}

export const coresClaras: Cores = {
  fundo: '#F6F8FA',
  superficie: '#FFFFFF',
  superficie2: '#EAEFF3',
  linha: '#D3DBE3',
  texto: '#16212C',
  textoSuave: '#586878',
  primaria: '#1F6FC8',
  sobrePrimaria: '#FFFFFF',
  primariaSuave: '#DCEEFD',
  sobrePrimariaSuave: '#0E3B6B',
  foco: '#4A9BE0',
  vidro: 'rgba(255,255,255,0.62)',
  vidroLinha: 'rgba(255,255,255,0.7)',
  sucesso: '#2E8B6A',
  sucessoSuave: '#D3EBE1',
  sobreSucessoSuave: '#14573F',
  alerta: '#D99A00',
  alertaSuave: '#FBEBC2',
  sobreAlertaSuave: '#5E4100',
  perigo: '#C73A2E',
  perigoSuave: '#F8DAD6',
  sobrePerigoSuave: '#7F1D14',
  metro: '#00835C',
  eu: '#1B6DE0',
};

export const coresEscuras: Cores = {
  fundo: '#0B1520',
  superficie: '#121F2D',
  superficie2: '#1A2A3C',
  linha: '#2A3C50',
  texto: '#EAF1F7',
  textoSuave: '#9FB1C2',
  primaria: '#7DBEF3',
  sobrePrimaria: '#071D36',
  primariaSuave: '#16344F',
  sobrePrimariaSuave: '#B0DCFC',
  foco: '#7DBEF3',
  vidro: 'rgba(18,31,45,0.55)',
  vidroLinha: 'rgba(255,255,255,0.14)',
  sucesso: '#5FCFA6',
  sucessoSuave: '#14392E',
  sobreSucessoSuave: '#A8EBD1',
  alerta: '#F2C14E',
  alertaSuave: '#40310B',
  sobreAlertaSuave: '#F8DE9C',
  perigo: '#FF8A7D',
  perigoSuave: '#471A16',
  sobrePerigoSuave: '#FFC9C2',
  metro: '#3FD0A0',
  eu: '#6BA9FF',
};

export const espaco = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

export const raio = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pilula: 999 } as const;

export const alvoToque = Platform.OS === 'ios' ? 44 : 48;

export const duracao = { rapida: 120, base: 220, lenta: 360 } as const;

/** No iOS 26 a barra de abas flutua sobre o conteúdo; no Android fica fora dele. */
export const ESPACO_ABAS = Platform.OS === 'ios' ? 96 : 0;

export const MARGEM = 16;

export interface Tema {
  cores: Cores;
  escuro: boolean;
}

export function useTema(): Tema {
  const escuro = useColorScheme() === 'dark';
  return { cores: escuro ? coresEscuras : coresClaras, escuro };
}

export function coresDoRisco(cores: Cores, nivel: NivelRisco) {
  switch (nivel) {
    case 'baixo':
      return { cor: cores.sucesso, suave: cores.sucessoSuave, sobre: cores.sobreSucessoSuave };
    case 'medio':
      return { cor: cores.alerta, suave: cores.alertaSuave, sobre: cores.sobreAlertaSuave };
    case 'alto':
      return { cor: cores.perigo, suave: cores.perigoSuave, sobre: cores.sobrePerigoSuave };
  }
}

export function coresDoStatus(cores: Cores, status: StatusRelato) {
  switch (status) {
    case 'aprovado':
      return { suave: cores.sucessoSuave, sobre: cores.sobreSucessoSuave };
    case 'pendente':
      return { suave: cores.superficie2, sobre: cores.textoSuave };
    case 'rejeitado':
      return { suave: cores.perigoSuave, sobre: cores.sobrePerigoSuave };
  }
}

export const tipografia = {
  titulo: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  subtitulo: { fontSize: 20, lineHeight: 26, fontWeight: '600' as const },
  corpo: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  corpoForte: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  legenda: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  legendaForte: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
};
