import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { gravarSessao, lerSessao, limparSessao } from '@/services/sessao';
import type { Sessao } from '@/types/dominio';

interface Valor {
  carregada: boolean;
  sessao: Sessao | null;
  entrar: (sessao: Sessao) => Promise<void>;
  sair: () => Promise<void>;
}

const Contexto = createContext<Valor | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregada, setCarregada] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);

  useEffect(() => {
    let ativo = true;
    void lerSessao().then((salva) => {
      if (!ativo) return;
      setSessao(salva);
      setCarregada(true);
    });
    return () => {
      ativo = false;
    };
  }, []);

  const entrar = useCallback(async (nova: Sessao) => {
    await gravarSessao(nova);
    setSessao(nova);
  }, []);

  const sair = useCallback(async () => {
    await limparSessao();
    setSessao(null);
  }, []);

  const valor = useMemo(() => ({ carregada, sessao, entrar, sair }), [carregada, sessao, entrar, sair]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Valor {
  const valor = useContext(Contexto);
  if (valor === null) throw new Error('useSessao precisa estar dentro de <SessaoProvider>.');
  return valor;
}
