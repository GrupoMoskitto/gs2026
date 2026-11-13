import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/** Recarrega os dados quando a tela volta a ficar em foco (por exemplo, depois de criar um relato). Ignora a primeira vez. */
export function useRecarregarAoVoltar(recarregar: () => void): void {
  const primeira = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeira.current) {
        primeira.current = false;
        return;
      }
      recarregar();
    }, [recarregar]),
  );
}
