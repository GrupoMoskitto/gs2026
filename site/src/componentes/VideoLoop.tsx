import { useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  nome: string;
  alt: string;
}

/**
 * Loop de uma tela do app. A capa (o primeiro quadro do loop) fica sempre por baixo; o vídeo só
 * aparece por cima quando já está tocando, então não pisca. Ele baixa quando o cartão chega perto
 * da tela e só toca enquanto está visível; com "reduzir movimento", fica só a capa.
 */
export function VideoLoop({ nome, alt }: Props) {
  const caixa = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const perto = useInView(caixa, { once: true, margin: '600px' });
  const visivel = useInView(caixa, { amount: 0.3 });
  const parado = useReducedMotion();
  const [tocando, setTocando] = useState(false);
  const usarVideo = perto && !parado;

  useEffect(() => {
    const v = video.current;
    if (!v || !usarVideo) return;
    if (visivel) v.play().catch(() => undefined);
    else v.pause();
  }, [usarVideo, visivel]);

  return (
    <div ref={caixa} className="relative h-full w-full">
      <img src={`/app/loops/${nome}.webp`} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover object-top" />
      {usarVideo ? (
        <video
          ref={video}
          src={`/app/loops/${nome}.mp4`}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          onPlaying={() => setTocando(true)}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 ${tocando ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}
    </div>
  );
}
