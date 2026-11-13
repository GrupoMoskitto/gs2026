// Carrega um dado assíncrono e expõe os estados que toda tela precisa: carregando, erro, pronto e
// "recarregando" (puxar para atualizar sem apagar o que já está na tela).
//
// O estado é derivado: guardamos só a última resposta e a chave (dependências) a que ela pertence.
// Se a chave mudou, ainda não há resposta para ela e a tela mostra "carregando".
import { useCallback, useEffect, useRef, useState } from 'react';

import { ehErroApi } from '@/services/erro';
import type { Resultado } from '@/types/servicos';

export type EstadoRecurso<T> =
  | { fase: 'carregando' }
  | { fase: 'erro'; mensagem: string }
  | { fase: 'pronto'; resultado: Resultado<T> };

export interface Recurso<T> {
  estado: EstadoRecurso<T>;
  /** true durante uma recarga pedida pela pessoa (puxar para atualizar), com os dados antigos ainda na tela */
  recarregando: boolean;
  /** Recarga pedida pela pessoa: `recarregando` fica true até terminar. */
  recarregar: () => void;
  /** Recarga em segundo plano (ao voltar para a tela): troca os dados quando chegam, sem nenhum indicador. */
  atualizar: () => void;
}

interface Pedido {
  versao: number;
  silencioso: boolean;
}

interface Resposta<T> {
  chave: string;
  versao: number;
  estado: { fase: 'erro'; mensagem: string } | { fase: 'pronto'; resultado: Resultado<T> };
}

export function useRecurso<T>(
  carregar: (sinal: AbortSignal) => Promise<Resultado<T>>,
  dependencias: readonly unknown[],
): Recurso<T> {
  const chave = JSON.stringify(dependencias);
  const [pedido, setPedido] = useState<Pedido>({ versao: 0, silencioso: false });
  const { versao } = pedido;
  const [resposta, setResposta] = useState<Resposta<T> | null>(null);

  // Sempre a função mais recente, sem precisar listá-la nas dependências do efeito.
  const carregarRef = useRef(carregar);
  useEffect(() => {
    carregarRef.current = carregar;
  });

  useEffect(() => {
    const controle = new AbortController();
    carregarRef
      .current(controle.signal)
      .then((resultado) => {
        if (controle.signal.aborted) return;
        setResposta({ chave, versao, estado: { fase: 'pronto', resultado } });
      })
      .catch((erro: unknown) => {
        if (controle.signal.aborted) return;
        const mensagem = ehErroApi(erro) ? erro.message : 'Algo deu errado. Tente de novo.';
        // Se já havia dados desta chave na tela, mantém e só encerra a recarga.
        setResposta((atual) =>
          atual !== null && atual.chave === chave && atual.estado.fase === 'pronto'
            ? { ...atual, versao }
            : { chave, versao, estado: { fase: 'erro', mensagem } },
        );
      });
    return () => controle.abort();
  }, [chave, versao]);

  const recarregar = useCallback(() => setPedido((p) => ({ versao: p.versao + 1, silencioso: false })), []);
  const atualizar = useCallback(() => setPedido((p) => ({ versao: p.versao + 1, silencioso: true })), []);

  const daChave = resposta !== null && resposta.chave === chave ? resposta : null;
  const estado: EstadoRecurso<T> = daChave ? daChave.estado : { fase: 'carregando' };
  const recarregando = daChave !== null && daChave.versao !== versao && !pedido.silencioso;

  return { estado, recarregando, recarregar, atualizar };
}
