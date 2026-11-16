import type { ReactNode } from 'react';

import { Letreiro } from './componentes/Letreiro';
import { Marca } from './componentes/Marca';
import { Surgir } from './componentes/Surgir';
import { Aplicativo } from './secoes/Aplicativo';
import { Capa, Topo } from './secoes/Capa';
import { Consulta } from './secoes/Consulta';
import { Equipe } from './secoes/Equipe';
import { Fluxo } from './secoes/Fluxo';
import { Modelo } from './secoes/Modelo';
import { Partes } from './secoes/Partes';
import { Fecho, Rodape } from './secoes/Rodape';

function Titulo({ children }: { children: ReactNode }) {
  return (
    <Surgir className="margem">
      <h2 className="titulo">{children}</h2>
    </Surgir>
  );
}

const vao = 'mt-28 md:mt-44';
const perto = 'mt-12 md:mt-16';

export function App() {
  return (
    <div id="top" className="overflow-x-clip">
      <Topo />
      <main>
        <Capa />

        <div className="mt-16 md:mt-20">
          <Letreiro />
        </div>

        <div className={vao}>
          <Titulo>
            O risco de cada lugar,
            <br /> agora <Marca /> e ao vivo
          </Titulo>
        </div>
        <div className={perto}>
          <Consulta />
        </div>

        <div className={vao}>
          <Titulo>
            Tudo no bolso
            <br /> do <Marca /> cidadão
          </Titulo>
        </div>
        <div className={perto}>
          <Aplicativo />
        </div>

        <div className={vao}>
          <Titulo>
            Um modelo <Marca /> treinado
            <br /> com dados reais
          </Titulo>
        </div>
        <div className={perto}>
          <Modelo />
        </div>

        <div className={vao}>
          <Titulo>
            Do relato <Marca /> ao mapa
          </Titulo>
        </div>
        <div className={perto}>
          <Fluxo />
        </div>

        <div className={vao}>
          <Titulo>
            Oito partes,
            <br /> uma <Marca /> solução
          </Titulo>
        </div>
        <div className={perto}>
          <Partes />
        </div>

        <div className={vao}>
          <Titulo>
            Quem faz <Marca /> o Radar
          </Titulo>
        </div>
        <div className={perto}>
          <Equipe />
        </div>

        <div className={vao}>
          <Fecho />
        </div>
      </main>
      <div className="mt-28 md:mt-40">
        <Rodape />
      </div>
    </div>
  );
}
