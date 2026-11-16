import { BrainCircuit } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

import { Carrossel, Cartao } from '../componentes/Carrossel';
import { Contagem } from '../componentes/Contagem';
import { LUGARES, RESUMO, inteiro, parte } from '../dados';

const horas = RESUMO.horas.map((roubos, hora) => ({ hora, roubos }));
const pico = RESUMO.horas.indexOf(Math.max(...RESUMO.horas));
const calma = RESUMO.horas.indexOf(Math.min(...RESUMO.horas));
const vezes = Math.round(RESUMO.horas[pico] / RESUMO.horas[calma]);
const contar = (tipo: string) => LUGARES.filter((l) => l.tipo === tipo).length;
const duas = (n: number) =>
  n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const itens = RESUMO.levados?.itens ?? [];
const maiorItem = Math.max(...itens.map((i) => i.parte), 0.0001);

function Dica({ active, payload }: { active?: boolean; payload?: { payload: { hora: number; roubos: number } }[] }) {
  if (!active || !payload?.length) return null;
  const { hora, roubos } = payload[0].payload;
  return (
    <div className="rounded-xl bg-superficie px-3 py-1.5 text-[15px] text-forte">
      <strong>
        {hora}h às {(hora + 1) % 24}h
      </strong>
      : {inteiro(roubos)}
    </div>
  );
}

const numero = 'text-[72px] leading-none font-medium tracking-[-0.04em]';

const emHoras = (n: number) => `${Math.round(n)}h`;

export function Modelo() {
  const grafico = useRef<HTMLDivElement>(null);
  const graficoVisto = useInView(grafico, {
    once: true,
    margin: '0px 0px -15% 0px',
  });

  return (
    <section id="modelo">
      <Carrossel icone={BrainCircuit} rotulo="O modelo de risco">
        <Cartao texto={`${inteiro(RESUMO.roubos)} roubos reais da SSP-SP, hora a hora.`} className="bg-marinho text-white">
          <div ref={grafico} className="absolute inset-x-5 bottom-5 top-2" role="img" aria-label={`Roubos por hora do dia, com pico às ${pico}h`}>
            {graficoVisto ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={horas} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap={2}>
                  <XAxis
                    dataKey="hora"
                    ticks={[0, 6, 12, 18]}
                    tickFormatter={(h: number) => `${h}h`}
                    tick={{ fill: '#B0DCFC', fontSize: 14 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<Dica />} cursor={{ fill: 'rgba(255,255,255,0.12)' }} />
                  <Bar dataKey="roubos" radius={[4, 4, 0, 0]} animationDuration={1100} animationEasing="ease-out">
                    {horas.map((h) => (
                      <Cell key={h.hora} fill={h.hora === pico ? '#FFFFFF' : '#4A9BE0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Cartao>

        <Cartao texto={`Às ${pico}h a cidade fica ${vezes} vezes mais arriscada que às ${calma}h.`} className="bg-celeste text-forte">
          <div className="flex h-full items-end justify-between px-7 pb-7">
            <p>
              <Contagem valor={pico} formato={emHoras} className={`${numero} block text-[96px]`} />
              <span className="text-[15px] font-medium">{inteiro(RESUMO.horas[pico])} roubos</span>
            </p>
            <p className="text-right">
              <Contagem valor={calma} formato={emHoras} className={`${numero} block`} />
              <span className="text-[15px] font-medium">{inteiro(RESUMO.horas[calma])} roubos</span>
            </p>
          </div>
        </Cartao>

        <Cartao texto={`O celular aparece em ${parte(itens[0]?.parte ?? 0)} dos roubos.`} className="bg-superficie text-forte">
          <ul className="grid h-full content-end gap-3 px-7 pb-7">
            {itens.map((i, n) => (
              <li key={i.rotulo} className="grid grid-cols-[112px_1fr_40px] items-center gap-3 text-[15px]">
                <span className="leading-tight">{i.rotulo}</span>
                <motion.span
                  className="h-2.5 origin-left rounded-full bg-azul"
                  style={{ width: `${(i.parte / maiorItem) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.9,
                    delay: 0.1 * n,
                    ease: [0.2, 0, 0, 1],
                  }}
                  aria-hidden="true"
                />
                <span className="text-right font-medium">{parte(i.parte)}</span>
              </li>
            ))}
          </ul>
        </Cartao>

        <Cartao texto={`O modelo acerta ${parte(RESUMO.modelo.acuracia)} dos níveis de risco no teste de 2026.`} className="bg-baixo-suave text-sobre-baixo">
          <div className="flex h-full flex-col justify-end px-7 pb-7">
            <p className={`${numero} text-[96px]`}>
              <Contagem valor={RESUMO.modelo.f1} formato={duas} />
            </p>
            <p className="mt-2 text-[15px] font-medium">
              de F1 macro, com RandomForest. Só repetir o nível do ano anterior dá {duas(RESUMO.modelo.f1_regra_simples)}.
            </p>
          </div>
        </Cartao>

        <Cartao texto="A Grande São Paulo inteira, em quatro faixas do dia." className="bg-azul text-white">
          <dl className="grid h-full content-end gap-4 px-7 pb-7">
            {[
              [contar('bairro'), 'bairros da Av. Paulista'],
              [contar('distrito'), 'distritos da capital'],
              [contar('municipio'), 'municípios vizinhos'],
            ].map(([n, rotulo]) => (
              <div key={rotulo} className="flex items-baseline gap-3">
                <dt className="order-2 text-[16px] font-medium">{rotulo}</dt>
                <dd className={`${numero} order-1 w-[1.9em] text-[56px]`}>
                  <Contagem valor={n as number} />
                </dd>
              </div>
            ))}
          </dl>
        </Cartao>
      </Carrossel>
    </section>
  );
}
