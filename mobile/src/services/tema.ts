// Preferência de tema: seguir o sistema, ou forçar claro ou escuro. Fica salva no aparelho.
// `Appearance.setColorScheme` troca o esquema do app inteiro, inclusive os componentes nativos
// (abas, cabeçalhos, mapa e vidro), não só as nossas cores.
import { Appearance } from 'react-native';

import { gravarJson, lerJson } from './armazenamento';

export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'tema';

export async function lerPreferenciaTema(): Promise<PreferenciaTema> {
  const salva = await lerJson<string>(CHAVE);
  return salva === 'claro' || salva === 'escuro' ? salva : 'sistema';
}

export function aplicarTema(preferencia: PreferenciaTema): void {
  // 'unspecified' devolve o controle ao sistema (nesta versão do React Native, no lugar de null).
  Appearance.setColorScheme(preferencia === 'sistema' ? 'unspecified' : preferencia === 'claro' ? 'light' : 'dark');
}

export async function salvarPreferenciaTema(preferencia: PreferenciaTema): Promise<void> {
  aplicarTema(preferencia);
  await gravarJson(CHAVE, preferencia);
}
