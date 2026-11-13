// Ícones. Ionicons vem junto com o Expo Go e tem a mesma aparência nas duas plataformas;
// as abas usam SF Symbols (iOS) e Material Symbols (Android) pelo componente nativo do sistema.
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type NomeIcone = ComponentProps<typeof Ionicons>['name'];

interface Props {
  nome: NomeIcone;
  tamanho?: number;
  cor: string;
}

export function Icone({ nome, tamanho = 22, cor }: Props) {
  return <Ionicons name={nome} size={tamanho} color={cor} accessibilityElementsHidden importantForAccessibility="no" />;
}
