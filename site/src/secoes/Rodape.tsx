import { Play } from 'lucide-react';

import { Logo } from '../componentes/Logo';
import { Marca } from '../componentes/Marca';
import { Radar } from '../componentes/Radar';
import { Surgir } from '../componentes/Surgir';
import { VideoApp } from '../componentes/VideoApp';
import { REPO } from '../dados';

const COLUNAS = [
  {
    titulo: 'Na página',
    elos: [
      ['O risco', '#consulta'],
      ['O app', '#app'],
      ['O modelo', '#modelo'],
      ['As partes', '#partes'],
    ],
  },
  {
    titulo: 'No GitHub',
    elos: [
      ['Repositório', REPO],
      ['App do cidadão', `${REPO}/tree/main/mobile`],
      ['Modelo de risco', `${REPO}/tree/main/ia`],
      ['Documentação', `${REPO}/tree/main/docs`],
    ],
  },
];

export function Fecho() {
  return (
    <section className="margem">
      <Surgir>
        <div className="relative isolate overflow-hidden rounded-bloco bg-marinho px-6 py-20 text-center text-white md:py-28">
          <Radar className="top-1/2 left-1/2 -z-10 w-[min(220vw,1300px)] -translate-x-1/2 -translate-y-1/2" />
          <p className="text-[16px] text-claro">Engenharia de Software, 3º ano · ODS 11, 9 e 10</p>
          <h2 className="titulo mt-4 text-white">
            Veja o Radar
            <br /> <Marca /> funcionando
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <VideoApp>
              <button type="button" className="botao bg-superficie text-forte hover:bg-celeste">
                <Play size={16} fill="currentColor" aria-hidden="true" /> Ver o app em 1 minuto
              </button>
            </VideoApp>
            <a href={REPO} className="botao bg-azul text-white hover:bg-azul-escuro">
              Abrir o repositório
            </a>
          </div>
        </div>
      </Surgir>
    </section>
  );
}

export function Rodape() {
  return (
    <footer className="margem pb-6">
      <div className="grid gap-10 rounded-bloco bg-superficie p-8 text-forte md:grid-cols-12 md:p-10">
        <div className="md:col-span-5">
          <p className="flex items-center gap-2.5 text-[18px] font-bold tracking-[-0.02em]">
            <Logo className="h-8 w-8" />
            Moskitto Radar
          </p>
          <p className="mt-4 max-w-[40ch] text-[15px] text-suave">
            O app não substitui o boletim de ocorrência. O risco vem das contagens públicas de roubos da SSP-SP, os relatos são simulados e não há nenhum dado
            pessoal real.
          </p>
        </div>
        {COLUNAS.map((c) => (
          <nav key={c.titulo} aria-label={c.titulo} className="md:col-span-2 md:col-start-auto">
            <p className="text-[15px] text-suave">{c.titulo}</p>
            <ul className="mt-3 grid gap-2 text-[15px] font-medium">
              {c.elos.map(([rotulo, destino]) => (
                <li key={rotulo}>
                  <a href={destino} className="elo">
                    {rotulo}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="text-[15px] md:col-span-3">
          <p className="text-suave">Projeto</p>
          <p className="mt-3 font-medium">Global Solution FIAP 2026.2</p>
          <p className="font-medium">CitizenTech</p>
          <p className="mt-2 text-suave">Mapa: OpenStreetMap.</p>
        </div>
      </div>
    </footer>
  );
}
