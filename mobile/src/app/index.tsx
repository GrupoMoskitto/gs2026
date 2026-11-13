import { Redirect } from 'expo-router';

import { useSessao } from '@/hooks/SessaoContexto';

export default function Raiz() {
  const { sessao } = useSessao();
  return <Redirect href={sessao ? '/mapa' : '/identificacao'} />;
}
