import { seguirPonteiro } from '../componentes/brilho';
import { Surgir } from '../componentes/Surgir';

const PESSOAS = [
  {
    nome: 'Gabriel Couto',
    rm: 'RM559579',
    partes: 'Modelo de risco e app do cidadão',
  },
  {
    nome: 'Gabriel Kato',
    rm: 'RM560000',
    partes: 'Servidor e botão de pânico',
  },
  {
    nome: 'João Vitor de Matos',
    rm: 'RM559246',
    partes: 'API, banco e app do moderador',
  },
  {
    nome: 'Marcelo Affonso',
    rm: 'RM559790',
    partes: 'Segurança, arquitetura e pitch',
  },
];

const iniciais = (nome: string) => {
  const p = nome.split(' ');
  return `${p[0][0]}${p[p.length - 1][0]}`;
};

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
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full bg-celeste text-[18px] font-medium transition-[background-color,color,transform] duration-300 ease-saida group-hover:scale-110 group-hover:-rotate-6 group-hover:bg-azul group-hover:text-white"
                aria-hidden="true"
              >
                {iniciais(p.nome)}
              </span>
              <div>
                <p className="text-[21px] leading-tight font-medium">{p.nome}</p>
                <p className="text-[15px] text-suave">{p.rm}</p>
                <p className="mt-3 text-[16px]">{p.partes}</p>
              </div>
            </li>
          </Surgir>
        ))}
      </ul>
    </section>
  );
}
