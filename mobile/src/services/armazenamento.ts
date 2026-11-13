// Guarda no aparelho (AsyncStorage): cache das respostas, fila de envio e identificação.
// Toda leitura e escrita é protegida: se o armazenamento falhar, o app segue sem ele.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIXO = 'mapa-relatos:';

export async function lerJson<T>(chave: string): Promise<T | null> {
  try {
    const texto = await AsyncStorage.getItem(PREFIXO + chave);
    if (texto === null) return null;
    return JSON.parse(texto) as T;
  } catch {
    return null;
  }
}

export async function gravarJson(chave: string, valor: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIXO + chave, JSON.stringify(valor));
  } catch {
    // sem espaço ou sem permissão: o app continua funcionando sem a cópia
  }
}

export async function removerChave(chave: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIXO + chave);
  } catch {
    // nada a fazer
  }
}

interface Salvo<T> {
  dados: T;
  salvoEm: string;
}

/** Cache da última resposta, com a hora em que foi salva. */
export async function lerCache<T>(chave: string): Promise<Salvo<T> | null> {
  return lerJson<Salvo<T>>(`cache:${chave}`);
}

export async function gravarCache<T>(chave: string, dados: T): Promise<void> {
  const salvo: Salvo<T> = { dados, salvoEm: new Date().toISOString() };
  await gravarJson(`cache:${chave}`, salvo);
}
