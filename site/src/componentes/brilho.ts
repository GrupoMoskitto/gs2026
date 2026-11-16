import type { PointerEvent } from 'react';

/** Guarda a posição do ponteiro no elemento, para o reflexo da classe `.brilho` seguir o cursor. */
export function seguirPonteiro(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`);
}
