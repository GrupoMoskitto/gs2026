import type { ReactNode } from 'react';

import { seguirPonteiro } from '../componentes/brilho';
import { IconeGithub, IconeLinkedin } from '../componentes/Marcas';
import { Surgir } from '../componentes/Surgir';

interface Pessoa {
  nome: string;
  rm: string;
  partes: string;
  github: string;
  linkedin?: string;
}

const PESSOAS: Pessoa[] = [
  {
    nome: 'Gabriel Couto',
    rm: 'RM559579',
    partes: 'Arquiteto geral da solução, modelo de risco e app do cidadão',
    github: 'rouri404',
    linkedin: 'https://www.linkedin.com/in/gabricouto',
  },
  {
    nome: 'Gabriel Kato',
    rm: 'RM560000',
    partes: 'Servidor e botão de pânico',
    github: 'kato8088',
    linkedin: 'https://www.linkedin.com/in/gabrikato/',
  },
  {
    nome: 'João Vitor de Matos',
    rm: 'RM559246',
    partes: 'API, banco e app do moderador',
    github: 'joaomatosq',
    linkedin: 'https://www.linkedin.com/in/joaomatosq',
  },
  {
    nome: 'Marcelo Affonso',
    rm: 'RM559790',
    partes: 'Segurança, arquitetura e pitch',
    github: 'marcelo215',
    linkedin: 'https://www.linkedin.com/in/marcelo-affonso-fonseca-899682333/',
  },
];

function Rede({ href, rotulo, children }: { href: string; rotulo: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={rotulo}
      title={rotulo}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-fundo text-forte transition-[background-color,color,transform] duration-200 ease-saida hover:-translate-y-0.5 hover:bg-azul hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul"
    >
      {children}
    </a>
  );
}

export function Equipe() {
  return (
    <section id="equipe" className="margem">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PESSOAS.map((p, i) => (
          <Surgir key={p.rm} atraso={i * 0.07}>
            <li
              onPointerMove={seguirPonteiro}
              className="brilho group flex h-full flex-col gap-6 rounded-bloco bg-superficie p-6 text-forte transition-transform duration-300 ease-saida hover:-translate-y-1.5"
            >
              <img
                src={`/equipe/${p.github}.webp`}
                alt={`Foto de ${p.nome} no GitHub`}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="h-16 w-16 rounded-full bg-celeste object-cover ring-4 ring-celeste transition-[transform,box-shadow] duration-300 ease-saida group-hover:scale-110 group-hover:-rotate-6 group-hover:ring-azul"
              />
              <div className="flex-1">
                <p className="text-[21px] leading-tight font-medium">{p.nome}</p>
                <p className="text-[15px] text-suave">{p.rm}</p>
                <p className="mt-3 text-[16px]">{p.partes}</p>
              </div>
              <div className="flex gap-2">
                <Rede href={`https://github.com/${p.github}`} rotulo={`GitHub de ${p.nome}`}>
                  <IconeGithub className="h-5 w-5" />
                </Rede>
                {p.linkedin ? (
                  <Rede href={p.linkedin} rotulo={`LinkedIn de ${p.nome}`}>
                    <IconeLinkedin className="h-[18px] w-[18px]" />
                  </Rede>
                ) : null}
              </div>
            </li>
          </Surgir>
        ))}
      </ul>
    </section>
  );
}
