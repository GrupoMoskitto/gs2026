import { Play } from 'lucide-react';
import { motion, useScroll, useSpring, useTransform } from 'motion/react';

import { Celular } from '../componentes/Celular';
import { BotaoTema } from '../componentes/Tema';
import { MiniApp } from '../componentes/MiniApp';
import { Contagem } from '../componentes/Contagem';
import { Logo } from '../componentes/Logo';
import { Marca } from '../componentes/Marca';
import { Radar } from '../componentes/Radar';
import { VideoApp } from '../componentes/VideoApp';
import { LUGARES, RESUMO, contarNiveis, faixaDeAgora } from '../dados';

const ELOS = [
  { rotulo: 'O vídeo', destino: '#video' },
  { rotulo: 'O risco', destino: '#consulta' },
  { rotulo: 'O app', destino: '#app' },
  { rotulo: 'O modelo', destino: '#modelo' },
  { rotulo: 'As partes', destino: '#partes' },
  { rotulo: 'Equipe', destino: '#equipe' },
];

export function Topo() {
  const { scrollYProgress } = useScroll();
  const lido = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <header className="sticky top-0 z-40 bg-fundo/90 backdrop-blur-sm">
      <motion.div className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-azul" style={{ scaleX: lido }} aria-hidden="true" />
      <div className="margem flex h-[72px] items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2.5 text-[18px] font-bold tracking-[-0.02em] text-forte">
          <Logo className="h-8 w-8" />
          Moskitto Radar
        </a>
        <nav aria-label="Seções" className="hidden gap-7 text-[15px] font-medium text-tinta md:flex">
          {ELOS.map((e) => (
            <a key={e.destino} href={e.destino} className="elo">
              {e.rotulo}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <BotaoTema />
          <a href="#consulta" className="botao min-h-11 bg-azul px-5 text-[15px] text-white hover:bg-azul-escuro">
            Ver o risco
          </a>
        </div>
      </div>
    </header>
  );
}

const duas = (n: number) =>
  n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function Capa() {
  const faixa = faixaDeAgora();
  const altos = contarNiveis(faixa).alto;
  const { scrollY } = useScroll();
  const subir = useTransform(scrollY, [0, 700], [0, -50]);
  const entrada = (atraso: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: atraso, ease: [0.2, 0, 0, 1] as const },
  });
  const NUMEROS = [
    { valor: LUGARES.length, rotulo: 'lugares cobertos' },
    { valor: RESUMO.roubos, rotulo: 'roubos analisados' },
    { valor: RESUMO.modelo.f1, rotulo: 'de F1 macro', formato: duas },
  ];

  return (
    <section className="margem grid items-center gap-x-10 gap-y-12 pt-8 pb-4 text-center lg:min-h-[calc(100svh-72px)] lg:grid-cols-[1.15fr_1fr] lg:pt-0 lg:text-left">
      <div className="relative z-10">
        <motion.p
          {...entrada(0)}
          className="mx-auto flex w-fit items-center gap-2 rounded-full bg-superficie px-4 py-2 text-[15px] font-medium text-forte lg:mx-0"
        >
          Global Solution FIAP 2026.2 · CitizenTech
        </motion.p>
        <motion.h1 {...entrada(0.06)} className="titulo mt-6 text-[clamp(40px,6.2vw,88px)] lg:text-left">
          Onde e quando
          <br /> o risco <Marca />
          <br className="max-lg:hidden" /> é maior
        </motion.h1>
        <motion.p {...entrada(0.12)} className="mx-auto mt-6 max-w-[44ch] text-[18px] text-tinta lg:mx-0">
          Um app para relatar roubos e um modelo de IA que aponta o risco em cada lugar e horário da Grande São Paulo.
        </motion.p>
        <motion.div {...entrada(0.18)} className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
          <a href="#consulta" className="botao bg-marinho text-white hover:bg-black">
            Consultar um lugar
          </a>
          <VideoApp>
            <button type="button" className="botao bg-superficie text-forte hover:bg-celeste">
              <Play size={16} fill="currentColor" aria-hidden="true" /> Ver o app em 1 minuto
            </button>
          </VideoApp>
        </motion.div>
        <motion.dl {...entrada(0.26)} className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-4 lg:justify-start">
          {NUMEROS.map((n) => (
            <div key={n.rotulo} className="flex flex-col">
              <dd className="order-1 text-[32px] leading-none font-medium tracking-[-0.03em] text-forte">
                <Contagem valor={n.valor} formato={n.formato} />
              </dd>
              <dt className="order-2 mt-1.5 text-[15px] text-suave">{n.rotulo}</dt>
            </div>
          ))}
        </motion.dl>
      </div>

      <div className="relative isolate flex flex-col items-center">
        <Radar className="top-1/2 left-1/2 -z-10 w-[min(210vw,1000px)] -translate-x-1/2 -translate-y-1/2" />
        <motion.div {...entrada(0.2)} className="relative w-[min(88vw,350px)] lg:w-[min(320px,calc((100svh-230px)*0.45))] lg:min-w-[250px]">
          <Celular className="shadow-[0_40px_80px_-30px_rgb(7_29_54/0.45)] dark:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
            <MiniApp />
          </Celular>
          <motion.div style={{ y: subir }} className="pointer-events-none absolute top-[14%] left-[90%] max-sm:hidden">
            <div className="flutuar">
              <motion.p
                initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
                animate={{ opacity: 1, scale: 1, rotate: 5 }}
                transition={{
                  duration: 0.5,
                  delay: 0.7,
                  ease: [0.34, 1.3, 0.64, 1],
                }}
                className="flex items-center gap-2 rounded-full bg-alto-suave px-4 py-2 text-[15px] font-medium whitespace-nowrap text-sobre-alto shadow-[0_12px_24px_-12px_rgb(127_29_20/0.5)]"
              >
                <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                  <span className="absolute inset-0 animate-ping rounded-full bg-alto motion-reduce:hidden" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-alto" />
                </span>
                {altos} em risco alto
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
