const url = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';

export const CONFIG_API = {
  baseUrl: url.replace(/\/+$/, ''),
  tempoLimiteMs: 8000,
  novasTentativas: 3,
  esperaBaseMs: 500,
  esperaMaximaMs: 8000,
  validadeCacheMs: 5 * 60 * 1000,
} as const;

export const API_CONFIGURADA = CONFIG_API.baseUrl.length > 0;
