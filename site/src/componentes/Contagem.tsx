import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';

import { inteiro } from '../dados';

interface Props {
  valor: number;
  formato?: (n: number) => string;
  className?: string;
}

/** Número que conta de zero até o valor quando aparece na tela. */
export function Contagem({ valor, formato = inteiro, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const visto = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const parado = useReducedMotion();
  const formatoAtual = useRef(formato);
  formatoAtual.current = formato;

  useEffect(() => {
    if (!visto || parado) return;
    const controle = animate(0, valor, {
      duration: 1.4,
      ease: [0.2, 0, 0, 1],
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = formatoAtual.current(v);
      },
    });
    return () => controle.stop();
  }, [visto, parado, valor]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {formato(valor)}
    </span>
  );
}
