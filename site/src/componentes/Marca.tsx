import { motion } from 'motion/react';

import { Logo } from './Logo';

/** A logo dentro de uma pastilha, para entrar no meio de um título. */
export function Marca() {
  return (
    <motion.span
      initial={{ scale: 0.3, rotate: -24, opacity: 0 }}
      whileInView={{ scale: 1, rotate: 0, opacity: 1, transition: { type: 'spring', stiffness: 260, damping: 16, delay: 0.25 } }}
      whileHover={{ rotate: 12, scale: 1.08 }}
      viewport={{ once: true }}
      transition={{ type: 'spring', stiffness: 600, damping: 22 }}
      className="mx-[0.12em] inline-flex h-[0.86em] w-[1.3em] translate-y-[-0.06em] items-center justify-center rounded-full bg-celeste align-middle"
      aria-hidden="true"
    >
      <Logo className="h-[78%] w-auto" />
    </motion.span>
  );
}
