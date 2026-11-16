import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react';
import { useRef, useState, type ReactNode } from 'react';

import { seguirPonteiro } from './brilho';
import { Surgir } from './Surgir';

interface Props {
  icone: LucideIcon;
  rotulo: string;
  children: ReactNode;
}

/** Fileira de cartões que rola para o lado, com o rótulo à esquerda, o progresso e as setas à direita. */
export function Carrossel({ icone: Icone, rotulo, children }: Props) {
  const trilho = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: trilho });
  const progresso = useSpring(scrollXProgress, { stiffness: 220, damping: 30 });
  const [ponta, setPonta] = useState<-1 | 0 | 1>(-1);
  useMotionValueEvent(scrollXProgress, 'change', (v) => setPonta(v <= 0.01 ? -1 : v >= 0.99 ? 1 : 0));
  const rolar = (sentido: 1 | -1) =>
    trilho.current?.scrollBy({
      left: sentido * Math.min(trilho.current.clientWidth * 0.8, 820),
      behavior: 'smooth',
    });

  return (
    <Surgir>
      <div className="margem flex items-center justify-between gap-4">
        <p className="flex items-center gap-2 rounded-full bg-superficie px-4 py-2 text-[15px] font-medium text-forte">
          <Icone size={17} aria-hidden="true" /> {rotulo}
        </p>
        <div className="flex items-center gap-2">
          <span className="mr-2 hidden h-1.5 w-24 overflow-hidden rounded-full bg-superficie sm:block" aria-hidden="true">
            <motion.span className="block h-full origin-left rounded-full bg-azul" style={{ scaleX: progresso }} />
          </span>
          {([-1, 1] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => rolar(s)}
              disabled={ponta === s}
              aria-label={s === 1 ? `Avançar em ${rotulo}` : `Voltar em ${rotulo}`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-superficie text-forte transition-[background-color,opacity,transform] hover:bg-celeste active:scale-90 disabled:opacity-40 disabled:hover:bg-superficie"
            >
              {s === 1 ? <ChevronRight size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={trilho}
        tabIndex={0}
        role="group"
        aria-label={rotulo}
        className="sem-barra mt-2 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-[max(16px,calc((100vw-1240px)/2))] px-[max(16px,calc((100vw-1240px)/2))] pt-3 pb-3"
      >
        {children}
      </div>
    </Surgir>
  );
}

export const cartaoBase =
  'brilho group flex h-[460px] w-[min(82vw,360px)] shrink-0 snap-start flex-col rounded-bloco transition-transform duration-300 ease-saida hover:-translate-y-2';

interface PropsCartao {
  texto: ReactNode;
  className: string;
  children: ReactNode;
}

export function Cartao({ texto, className, children }: PropsCartao) {
  return (
    <article onPointerMove={seguirPonteiro} className={`${cartaoBase} overflow-hidden ${className}`}>
      <h3 className="px-7 pt-7 text-[21px] leading-snug font-medium text-balance">{texto}</h3>
      <div className="relative mt-5 min-h-0 flex-1">{children}</div>
    </article>
  );
}
