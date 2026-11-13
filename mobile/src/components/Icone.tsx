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
