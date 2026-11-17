import {
  Backpack,
  Bike,
  Car,
  Check,
  CircleEllipsis,
  List,
  Map as IconeMapa,
  MapPin,
  Plus,
  ShieldAlert,
  Smartphone,
  Store,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { MapaPreguicoso } from './MapaPreguicoso';
import {
  FAIXAS,
  NA_FAIXA,
  ROTULO_FAIXA,
  ROTULO_NIVEL,
  contarNiveis,
  decimal,
  faixaDeAgora,
  maioresRiscos,
  nivelDe,
  taxaDe,
  type Faixa,
  type Lugar,
  type Nivel,
} from '../dados';

type Aba = 'mapa' | 'relatos' | 'risco';
type Tipo = 'celular' | 'bolsa_mochila' | 'veiculo' | 'bicicleta' | 'comercio' | 'outro';
interface Relato {
  id: number;
  tipo: Tipo;
  lugar: string;
  quando: string;
  status: 'pendente' | 'aprovado';
  demo?: boolean;
}

const TIPOS: Record<Tipo, { rotulo: string; icone: LucideIcon }> = {
  celular: { rotulo: 'Celular', icone: Smartphone },
  bolsa_mochila: { rotulo: 'Bolsa', icone: Backpack },
  veiculo: { rotulo: 'Veículo', icone: Car },
  bicicleta: { rotulo: 'Bicicleta', icone: Bike },
  comercio: { rotulo: 'Comércio', icone: Store },
  outro: { rotulo: 'Outro', icone: CircleEllipsis },
};

// Relatos de exemplo, inventados para a simulação.
const RELATOS: Relato[] = [
  {
    id: 1,
    tipo: 'celular',
    lugar: 'Bela Vista',
    quando: 'Hoje, 21:35',
    status: 'aprovado',
  },
  {
    id: 2,
    tipo: 'bicicleta',
    lugar: 'Mooca',
    quando: 'Hoje, 18:10',
    status: 'aprovado',
  },
  {
    id: 3,
    tipo: 'bolsa_mochila',
    lugar: 'Consolação',
    quando: 'Ontem, 22:40',
    status: 'aprovado',
  },
  {
    id: 4,
    tipo: 'veiculo',
    lugar: 'Santo André',
    quando: 'Ontem, 19:05',
    status: 'pendente',
  },
  {
    id: 5,
    tipo: 'comercio',
    lugar: 'Pinheiros',
    quando: 'Seg, 14:20',
    status: 'aprovado',
  },
];

const SELO: Record<Nivel, string> = {
  baixo: 'bg-baixo-suave text-sobre-baixo',
  medio: 'bg-medio-suave text-sobre-medio',
  alto: 'bg-alto-suave text-sobre-alto',
};

// Roteiro da demonstração: [alvo em data-demo, espera em ms até o próximo toque].
const ROTEIRO: [string, number][] = [
  ['regiao', 1300],
  ['faixa-manha', 1300],
  ['faixa-noite', 1500],
  ['maior', 2600],
  ['fechar-folha', 1100],
  ['novo', 1100],
  ['tipo-celular', 1000],
  ['enviar', 2600],
  ['aba-risco', 1500],
  ['faixa-tarde', 1500],
  ['ranking-1', 2600],
  ['fechar-folha', 1300],
];
const PARADO_ANTES_DE_VOLTAR = 7000;

const ABAS: { aba: Aba; rotulo: string; icone: LucideIcon }[] = [
  { aba: 'mapa', rotulo: 'Mapa', icone: IconeMapa },
  { aba: 'relatos', rotulo: 'Relatos', icone: List },
  { aba: 'risco', rotulo: 'Risco', icone: ShieldAlert },
];

function Faixas({ faixa, aoMudar }: { faixa: Faixa; aoMudar: (f: Faixa) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1" role="group" aria-label="Faixa do dia">
      {FAIXAS.map((f) => (
        <button
          key={f}
          type="button"
          aria-pressed={f === faixa}
          data-demo={`faixa-${f}`}
          onClick={() => aoMudar(f)}
          className={`rounded-full py-1 text-[10px] font-medium transition-colors ${f === faixa ? 'bg-marinho text-white' : 'bg-fundo text-forte'}`}
        >
          {ROTULO_FAIXA[f]}
        </button>
      ))}
    </div>
  );
}

/** Simulação do app dentro da moldura do celular: mapa, relatos, risco e envio de um relato. */
export function MiniApp() {
  const [aba, setAba] = useState<Aba>('mapa');
  const [faixa, setFaixa] = useState<Faixa>(faixaDeAgora);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [relatos, setRelatos] = useState(RELATOS);
  const [formulario, setFormulario] = useState(false);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [aviso, setAviso] = useState(false);

  const caixa = useRef<HTMLDivElement>(null);
  const visivel = useInView(caixa, { amount: 0.5 });
  const semMovimento = useReducedMotion();
  const [ultimoToque, setUltimoToque] = useState(0);
  const automatico = useRef(false);
  const [toque, setToque] = useState<{ x: number; y: number; id: number } | null>(null);

  // Enquanto ninguém mexe, a simulação toca nos próprios botões seguindo o ROTEIRO.
  useEffect(() => {
    if (!visivel || semMovimento) return;
    let vivo = true;
    const relogios: number[] = [];
    const esperar = (ms: number) => new Promise<void>((pronto) => relogios.push(window.setTimeout(pronto, ms)));
    const reiniciar = () => {
      setAba('mapa');
      setLugar(null);
      setFormulario(false);
      setTipo(null);
      setFaixa(faixaDeAgora());
      setRelatos((r) => r.filter((x) => !x.demo));
    };

    (async () => {
      await esperar(ultimoToque ? PARADO_ANTES_DE_VOLTAR : 1800);
      if (!vivo) return;
      if (ultimoToque) {
        reiniciar();
        await esperar(900);
      }
      for (let i = 0; vivo; i = (i + 1) % ROTEIRO.length) {
        const [alvo, espera] = ROTEIRO[i];
        const el = caixa.current?.querySelector<HTMLElement>(`[data-demo="${alvo}"]`);
        if (el && caixa.current) {
          const r = el.getBoundingClientRect();
          const c = caixa.current.getBoundingClientRect();
          setToque({ x: r.left - c.left + r.width / 2, y: r.top - c.top + r.height / 2, id: Date.now() });
          await esperar(300);
          if (!vivo) return;
          automatico.current = true;
          el.click();
          automatico.current = false;
        }
        await esperar(espera);
        if (i === ROTEIRO.length - 1 && vivo) {
          reiniciar();
          await esperar(900);
        }
      }
    })();

    return () => {
      vivo = false;
      relogios.forEach(clearTimeout);
    };
  }, [visivel, semMovimento, ultimoToque]);

  // No toque, só um toque de verdade (ou a pinça) para a demonstração; rolar a página por cima do celular não.
  const interagir = () => {
    setToque(null);
    setUltimoToque(Date.now());
  };

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(false), 2600);
    return () => clearTimeout(t);
  }, [aviso]);

  const maior = maioresRiscos(faixa, 1)[0];
  const local = lugar ?? maior;
  const contagem = contarNiveis(faixa);

  const enviar = () => {
    if (!tipo) return;
    setRelatos((r) => [
      {
        id: Date.now(),
        tipo,
        lugar: local.nome,
        quando: 'Agora',
        status: 'pendente',
        demo: automatico.current,
      },
      ...r,
    ]);
    setFormulario(false);
    setTipo(null);
    setAba('relatos');
    setAviso(true);
  };

  return (
    <div
      ref={caixa}
      onPointerDownCapture={(e) => e.pointerType === 'mouse' && interagir()}
      onClickCapture={(e) => e.nativeEvent.isTrusted && interagir()}
      onTouchStartCapture={(e) => e.touches.length > 1 && interagir()}
      onWheelCapture={interagir}
      onKeyDownCapture={interagir}
      className="relative flex h-full w-full flex-col overflow-hidden bg-fundo text-left text-[12px] leading-snug text-tinta select-none"
      data-ui
    >
      <div className="flex shrink-0 items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-medium text-forte" aria-hidden="true">
        <span>13:41</span>
        <span className="h-2.5 w-2.5 rounded-full bg-marinho" />
        <span className="h-2 w-4 rounded-[3px] bg-marinho" />
      </div>

      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={aba}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
          >
            {aba === 'mapa' ? (
              <div className="relative h-full bg-[#e6eef4]">
                <MapaPreguicoso faixa={faixa} escolhido={lugar} aoEscolher={setLugar} compacto />
                <p className="absolute bottom-1 left-2 z-[1] rounded bg-superficie/80 px-1 text-[8px] text-suave">© OpenStreetMap</p>

                <div className="absolute inset-x-2.5 top-2 rounded-[18px] bg-superficie p-2.5 shadow-[0_6px_16px_-10px_rgb(7_29_54/0.5)]">
                  <p className="text-[10px] text-suave">Agora, {NA_FAIXA[faixa]}</p>
                  <button type="button" data-demo="maior" onClick={() => setLugar(maior)} className="text-[13px] font-medium text-forte">
                    Maior risco: {maior.nome}
                  </button>
                  <div className="mt-2">
                    <Faixas faixa={faixa} aoMudar={setFaixa} />
                  </div>
                </div>

                <AnimatePresence>
                  {lugar ? (
                    <motion.div
                      key="folha"
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '110%' }}
                      transition={{
                        type: 'spring',
                        stiffness: 320,
                        damping: 32,
                      }}
                      className={`absolute inset-x-2.5 bottom-2.5 rounded-[20px] p-3 ${SELO[nivelDe(lugar.codigo, faixa)]}`}
                    >
                      <button
                        type="button"
                        onClick={() => setLugar(null)}
                        data-demo="fechar-folha"
                        aria-label="Fechar"
                        className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-superficie/70"
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                      <p className="text-[19px] leading-none font-medium tracking-[-0.02em]">
                        Risco {ROTULO_NIVEL[nivelDe(lugar.codigo, faixa)].toLowerCase()}
                      </p>
                      <p className="mt-1.5 pr-6 text-[13px] font-medium">{lugar.nome}</p>
                      <p className="text-[11px]">
                        {decimal(taxaDe(lugar.codigo, faixa))} roubos por dia {NA_FAIXA[faixa]}
                      </p>
                      <div className="mt-2 grid grid-cols-4 gap-1">
                        {FAIXAS.map((f) => (
                          <p key={f} className={`rounded-lg py-1 text-center text-[9px] ${f === faixa ? 'bg-marinho text-white' : 'bg-superficie text-forte'}`}>
                            {ROTULO_FAIXA[f]}
                            <span className="block text-[10px] font-medium">{ROTULO_NIVEL[nivelDe(lugar.codigo, f)]}</span>
                          </p>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="novo"
                      type="button"
                      data-demo="novo"
                      onClick={() => setFormulario(true)}
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      whileTap={{ scale: 0.94 }}
                      className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-azul px-3.5 py-2.5 text-[12px] font-medium text-white shadow-[0_8px_18px_-8px_rgb(31_111_200/0.9)]"
                    >
                      <Plus size={14} aria-hidden="true" /> Novo relato
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            ) : null}

            {aba === 'relatos' ? (
              <div className="sem-barra h-full overflow-y-auto px-3 pb-3">
                <div className="flex items-center justify-between py-2">
                  <p className="text-[18px] font-medium tracking-[-0.02em] text-forte">Relatos</p>
                  <button
                    type="button"
                    onClick={() => setFormulario(true)}
                    className="flex items-center gap-1 rounded-full bg-azul px-3 py-1.5 text-[11px] font-medium text-white"
                  >
                    <Plus size={12} aria-hidden="true" /> Novo
                  </button>
                </div>
                <ul className="grid gap-1.5">
                  <AnimatePresence initial={false}>
                    {relatos.map((r) => {
                      const Icone = TIPOS[r.tipo].icone;
                      return (
                        <motion.li
                          key={r.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2.5 rounded-[16px] bg-superficie p-2.5"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-nevoa text-forte">
                            <Icone size={15} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-medium text-forte">
                              {TIPOS[r.tipo].rotulo} · {r.lugar}
                            </span>
                            <span className="text-[10px] text-suave">{r.quando}</span>
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${r.status === 'aprovado' ? SELO.baixo : SELO.medio}`}>
                            {r.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                          </span>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>
            ) : null}

            {aba === 'risco' ? (
              <div className="sem-barra h-full overflow-y-auto px-3 pb-3">
                <p className="py-2 text-[18px] font-medium tracking-[-0.02em] text-forte">Risco da região</p>
                <div className="rounded-[16px] bg-superficie p-2.5">
                  <Faixas faixa={faixa} aoMudar={setFaixa} />
                  <div className="mt-2.5 grid grid-cols-3 gap-1">
                    {(['alto', 'medio', 'baixo'] as const).map((n) => (
                      <p key={n} className={`rounded-xl py-1.5 text-center text-[10px] ${SELO[n]}`}>
                        <span className="block text-[17px] leading-none font-medium tabular-nums">{contagem[n]}</span>
                        {ROTULO_NIVEL[n].toLowerCase()}
                      </p>
                    ))}
                  </div>
                </div>
                <p className="mt-3 mb-1.5 text-[11px] text-suave">Maiores riscos {NA_FAIXA[faixa]}</p>
                <ol className="grid gap-1.5">
                  {maioresRiscos(faixa, 6).map((l, i) => {
                    const nivel = nivelDe(l.codigo, faixa);
                    return (
                      <li key={l.codigo}>
                        <button
                          type="button"
                          data-demo={`ranking-${i}`}
                          onClick={() => {
                            setLugar(l);
                            setAba('mapa');
                          }}
                          className="flex w-full items-center gap-2 rounded-[14px] bg-superficie px-2.5 py-2 text-left"
                        >
                          <span className="w-3 text-[10px] text-suave tabular-nums">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-forte">{l.nome}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${SELO[nivel]}`}>{ROTULO_NIVEL[nivel]}</span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav aria-label="Abas do app" className="grid shrink-0 grid-cols-3 bg-superficie px-2 pt-1.5 pb-3">
        {ABAS.map(({ aba: a, rotulo, icone: Icone }) => (
          <button
            key={a}
            type="button"
            aria-pressed={aba === a}
            data-demo={`aba-${a}`}
            onClick={() => setAba(a)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-medium text-forte"
          >
            <span className={`flex h-6 w-12 items-center justify-center rounded-full transition-colors duration-200 ${aba === a ? 'bg-celeste' : ''}`}>
              <Icone size={15} aria-hidden="true" />
            </span>
            {rotulo}
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {formulario ? (
          <motion.div
            key="formulario"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}
            className="absolute inset-0 z-10 flex flex-col bg-fundo px-3 pt-8 pb-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-[18px] font-medium tracking-[-0.02em] text-forte">Novo relato</p>
              <button
                type="button"
                onClick={() => setFormulario(false)}
                aria-label="Fechar"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-superficie text-forte"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 mb-1.5 text-[11px] font-medium text-forte">O que aconteceu</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(TIPOS) as Tipo[]).map((t) => {
                const Icone = TIPOS[t].icone;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tipo === t}
                    data-demo={`tipo-${t}`}
                    onClick={() => setTipo(t)}
                    className={`flex items-center gap-1.5 rounded-[14px] px-2.5 py-2 text-[11px] font-medium transition-colors ${tipo === t ? 'bg-marinho text-white' : 'bg-superficie text-forte'}`}
                  >
                    <Icone size={13} aria-hidden="true" /> {TIPOS[t].rotulo}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 mb-1.5 text-[11px] font-medium text-forte">Onde e quando</p>
            <p className="flex items-center gap-2 rounded-[14px] bg-superficie px-2.5 py-2 text-[11px] text-forte">
              <MapPin size={13} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate font-medium">{local.nome}</span>
              <span className="ml-auto shrink-0 text-suave">agora</span>
            </p>
            <p className="mt-2 text-[10px] text-suave">Local aproximado e nenhum dado pessoal.</p>
            <button
              type="button"
              data-demo="enviar"
              onClick={enviar}
              disabled={!tipo}
              className="mt-auto rounded-full bg-azul py-2.5 text-[12px] font-medium text-white transition-opacity disabled:opacity-40"
            >
              Enviar relato
            </button>
          </motion.div>
        ) : null}
        {aviso ? (
          <motion.p
            key="aviso"
            role="status"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute inset-x-3 bottom-16 z-20 flex items-center gap-2 rounded-full bg-marinho px-3.5 py-2.5 text-[11px] font-medium text-white"
          >
            <Check size={13} aria-hidden="true" /> Relato enviado para moderação
          </motion.p>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {toque ? (
          <motion.span
            key={toque.id}
            className="pointer-events-none absolute z-30 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-azul/30 ring-2 ring-azul/70"
            style={{ left: toque.x, top: toque.y }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1, 0.75], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, times: [0, 0.35, 1] }}
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
