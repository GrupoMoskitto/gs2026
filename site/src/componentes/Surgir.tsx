import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  atraso?: number;
  className?: string;
}

/** Entrada de um bloco quando ele aparece na tela: sobe, ganha opacidade e foco, uma vez só. */
export function Surgir({ children, atraso = 0, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.7, delay: atraso, ease: [0.2, 0, 0, 1] }}
    >
      {children}
    </motion.div>
  );
}
