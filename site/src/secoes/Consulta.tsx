import { AnimatePresence, motion } from 'motion/react';
import { ToggleGroup } from 'radix-ui';
import { useState } from 'react';

import { BuscaLugar } from '../componentes/BuscaLugar';
import { MapaPreguicoso } from '../componentes/MapaPreguicoso';
import { Surgir } from '../componentes/Surgir';
import {
  COR_NIVEL,
  FAIXAS,
  HORAS_FAIXA,
  NA_FAIXA,
  RESUMO,
  ROTULO_FAIXA,
  ROTULO_NIVEL,
  ROTULO_TIPO,
  contarNiveis,
  decimal,
  faixaDeAgora,
  inteiro,
  maioresRiscos,
  mesPorExtenso,
  nivelDe,
  parte,
  taxaDe,
  type Faixa,
  type Lugar,
  type Nivel,
} from '../dados';

const SELO: Record<Nivel, string> = {
  baixo: 'bg-baixo-suave text-sobre-baixo',
  medio: 'bg-medio-suave text-sobre-medio',
  alto: 'bg-alto-suave text-sobre-alto',
};

function Detalhe({ lugar, faixa }: { lugar: Lugar; faixa: Faixa }) {
  const nivel = nivelDe(lugar.codigo, faixa);
  const resumo = RESUMO.lugares[lugar.codigo];
  const i = FAIXAS.indexOf(faixa);
  const total = resumo ? resumo.celular[i] + resumo.veiculo[i] : 0;
  const noMes = resumo?.mes?.reduce((s, v) => s + v, 0) ?? 0;

  return (
    <motion.div
      key={`${lugar.codigo}-${faixa}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22 }}
      className={`rounded-[22px] p-6 ${SELO[nivel]}`}
    >
      <p className="text-[44px] leading-none font-medium tracking-[-0.03em]">Risco {ROTULO_NIVEL[nivel].toLowerCase()}</p>
      <p className="mt-3 text-[20px] leading-tight font-medium">{lugar.nome}</p>
      <p className="text-[15px]">{ROTULO_TIPO[lugar.tipo] ?? lugar.tipo}</p>
      <p className="mt-4 text-[16px]">
        {NA_FAIXA[faixa]} ({HORAS_FAIXA[faixa]}), foram {decimal(taxaDe(lugar.codigo, faixa))} roubos por dia no último ano
        {total > 0 && resumo ? `, ${parte(resumo.celular[i] / total)} de celular.` : '.'}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-1.5" role="list" aria-label="Risco em cada faixa do dia">
        {FAIXAS.map((f) => (
          <div key={f} role="listitem" className={`rounded-xl px-1 py-2 text-center ${f === faixa ? 'bg-marinho text-white' : 'bg-superficie text-forte'}`}>
            <p className="text-[13px]">{ROTULO_FAIXA[f]}</p>
            <p className="text-[15px] font-medium">{ROTULO_NIVEL[nivelDe(lugar.codigo, f)]}</p>
          </div>
        ))}
      </div>
      {noMes >= 1 && RESUMO.mes ? (
        <p className="mt-4 text-[15px]">
          Previsão para {mesPorExtenso(RESUMO.mes.referencia)}: cerca de {inteiro(noMes)} roubos aqui.
        </p>
      ) : null}
    </motion.div>
  );
}

export function Consulta() {
  const [faixa, setFaixa] = useState<Faixa>(faixaDeAgora);
  const [lugar, setLugar] = useState<Lugar>(() => maioresRiscos(faixaDeAgora(), 1)[0]);
  const contagem = contarNiveis(faixa);
  const ranking = maioresRiscos(faixa, 4);

  return (
    <section id="consulta" className="margem">
      <Surgir>
        <div className="grid gap-3 rounded-bloco bg-superficie p-3 lg:grid-cols-12">
          <div className="h-[52svh] min-h-[340px] overflow-hidden rounded-[22px] lg:col-span-7 lg:h-auto lg:min-h-[620px]" data-ui>
            <MapaPreguicoso faixa={faixa} escolhido={lugar} aoEscolher={setLugar} />
          </div>

          <div className="flex flex-col gap-3 p-2 lg:col-span-5 lg:p-4">
            <h3 className="text-[21px] leading-snug font-medium text-forte">Escolha o lugar e a faixa do dia, ou toque num ponto do mapa.</h3>
            <BuscaLugar escolhido={lugar} aoEscolher={setLugar} />
            <ToggleGroup.Root
              type="single"
              value={faixa}
              onValueChange={(v) => v && setFaixa(v as Faixa)}
              aria-label="Faixa do dia"
              className="grid grid-cols-4 gap-1.5"
            >
              {FAIXAS.map((f) => (
                <ToggleGroup.Item
                  key={f}
                  value={f}
                  className="min-h-11 rounded-full bg-fundo text-[15px] font-medium text-forte transition-colors hover:bg-nevoa data-[state=on]:bg-marinho data-[state=on]:text-white"
                >
                  {ROTULO_FAIXA[f]}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>

            <AnimatePresence mode="wait">
              <Detalhe lugar={lugar} faixa={faixa} />
            </AnimatePresence>

            <div className="rounded-[22px] bg-fundo p-5">
              <p className="text-[16px] font-medium text-forte">Maiores riscos {NA_FAIXA[faixa]}</p>
              <ol className="mt-2 grid">
                {ranking.map((l) => (
                  <li key={l.codigo}>
                    <button
                      type="button"
                      onClick={() => setLugar(l)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-left transition-colors hover:bg-superficie"
                    >
                      <span className="text-[16px] font-medium">{l.nome}</span>
                      <span className="text-[15px] text-suave">{decimal(taxaDe(l.codigo, faixa))} roubos/dia</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-3 text-[15px] text-suave">
                {(['alto', 'medio', 'baixo'] as const).map((n) => (
                  <span key={n} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_NIVEL[n] }} aria-hidden="true" />
                    {contagem[n]} {ROTULO_NIVEL[n].toLowerCase()}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </Surgir>
    </section>
  );
}
