import { ArrowUpRight, Play } from 'lucide-react';
import { useState } from 'react';

import { Surgir } from '../componentes/Surgir';

export const VIDEO_YOUTUBE = 'https://youtu.be/Z_ufQk3Rwaw';
const EMBED = 'https://www.youtube-nocookie.com/embed/Z_ufQk3Rwaw?autoplay=1&rel=0';

/** O vídeo da solução, no YouTube. O player só carrega no clique: até lá, é uma imagem. */
export function VideoSolucao() {
  const [tocando, setTocando] = useState(false);

  return (
    <section id="video" className="margem scroll-mt-24">
      <Surgir>
        <div className="relative aspect-video overflow-hidden rounded-bloco bg-black">
          {tocando ? (
            <iframe
              src={EMBED}
              title="Moskitto Radar: a solução em vídeo"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 h-full w-full"
            />
          ) : (
            <button type="button" onClick={() => setTocando(true)} className="group absolute inset-0 h-full w-full cursor-pointer">
              <img src="/videos/solucao.webp" alt="" width={1280} height={720} loading="lazy" className="h-full w-full object-cover" />
              <span className="botao absolute bottom-3 left-3 bg-azul text-white transition-transform group-hover:scale-105 group-hover:bg-azul-escuro max-sm:min-h-10 max-sm:px-4 max-sm:text-[15px] sm:bottom-6 sm:left-6">
                <Play size={18} fill="currentColor" aria-hidden="true" /> Assistir à solução
              </span>
            </button>
          )}
        </div>
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[15px] text-suave">
          <span className="text-center">O problema, a ideia e as oito partes funcionando juntas.</span>
          <a href={VIDEO_YOUTUBE} className="elo inline-flex items-center gap-1 font-medium text-forte">
            Abrir no YouTube <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </p>
      </Surgir>
    </section>
  );
}
