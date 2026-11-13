// Estado da conexão do aparelho. Quando a rede volta, esvazia a fila de relatos pendentes.
import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

import { assinarFila, enviarFila, lerFila } from '@/services/fila';
import type { Relato } from '@/types/dominio';
import type { RelatoPendente } from '@/types/servicos';

/** true = conectado (ou ainda não sabemos). Só vira false quando o sistema diz que está sem rede. */
export function useConexao(): boolean {
  const [conectado, setConectado] = useState(true);
  useEffect(() => {
    return NetInfo.addEventListener((estado) => {
      setConectado(estado.isConnected !== false && estado.isInternetReachable !== false);
    });
  }, []);
  return conectado;
}

/** Relatos esperando envio. Atualiza sozinho quando a fila muda. */
export function useFila(): RelatoPendente[] {
  const [fila, setFila] = useState<RelatoPendente[]>([]);
  useEffect(() => {
    let ativo = true;
    void lerFila().then((f) => {
      if (ativo) setFila(f);
    });
    const parar = assinarFila((f) => {
      if (ativo) setFila(f);
    });
    return () => {
      ativo = false;
      parar();
    };
  }, []);
  return fila;
}

/** Tenta enviar a fila quando o app abre e toda vez que a conexão volta. */
export function useEnvioDaFila(aoEnviar?: (enviados: Relato[]) => void): void {
  useEffect(() => {
    let ativo = true;
    const tentar = async () => {
      const { enviados } = await enviarFila();
      if (ativo && enviados.length > 0) aoEnviar?.(enviados);
    };
    void tentar();
    const parar = NetInfo.addEventListener((estado) => {
      if (estado.isConnected === true && estado.isInternetReachable !== false) void tentar();
    });
    return () => {
      ativo = false;
      parar();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
