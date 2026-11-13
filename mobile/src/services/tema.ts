// Tema escolhido nos Ajustes, salvo no aparelho. `Appearance.setColorScheme` troca o app inteiro, inclusive os componentes nativos.
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
