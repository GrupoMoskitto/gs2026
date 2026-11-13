// Rota raiz ("/"): só decide para onde ir. Sem identificação salva, vai para a identificação; com ela, para o mapa.
import { Redirect } from 'expo-router';

import { useSessao } from '@/hooks/SessaoContexto';

export default function Raiz() {
  const { sessao } = useSessao();
  return <Redirect href={sessao ? '/mapa' : '/identificacao'} />;
}
