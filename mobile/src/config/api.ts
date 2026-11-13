// Configuração da API. Para apontar para a API do João, crie um arquivo .env (não vai para o git):
//   EXPO_PUBLIC_API_URL=http://192.168.0.10:5000
// No celular, "localhost" é o próprio celular: use o IP do computador na mesma rede Wi-Fi.
// Sem a variável, o app usa dados de exemplo e avisa isso na tela.

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
