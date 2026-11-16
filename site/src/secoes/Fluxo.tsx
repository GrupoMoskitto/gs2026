import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  Database,
  MapPinned,
  MessageSquarePlus,
  ShieldCheck,
  Siren,
  TreePine,
  X,
  type LucideIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Celular } from '../componentes/Celular';
import { Codigo, json } from '../componentes/Codigo';
import { Surgir } from '../componentes/Surgir';
import { COR_NIVEL, FAIXAS, LUGARES, RESUMO, ROTULO_FAIXA, ROTULO_NIVEL, decimal, nivelDe, previsaoDe, taxaDe, type Faixa } from '../dados';

const DURACAO = 8000;

// Relatos de exemplo no formato comum do AGENTS.md (dados simulados).
const RELATO = {
  tipo: 'celular',
  descricao: 'Levaram meu celular no ponto de ônibus',
  latitude: -23.561,
  longitude: -46.656,
  bairro: 'bela_vista',
  ocorrido_em: '2026-11-10T21:35:00-03:00',
  origem: 'mobile',
};
const RELATO_IOT = { tipo: 'outro', latitude: -23.557, longitude: -46.661, bairro: 'consolacao', origem: 'iot' };

// Um lugar cujo risco muda ao longo do dia, para o exemplo do modelo.
const variedade = (codigo: string) => new Set(FAIXAS.map((f) => nivelDe(codigo, f))).size;
const LUGAR_EXEMPLO = LUGARES.find((l) => variedade(l.codigo) === 3) ?? LUGARES.find((l) => variedade(l.codigo) === 2) ?? LUGARES[0];

function VisualRelato() {
  return (
    <div className="grid w-full items-center gap-5 sm:grid-cols-[170px_1fr]">
      <div className="mx-auto w-[160px]">
        <Celular>
          <img src="/app/novo-relato.webp" alt="Formulário de novo relato no app" className="h-full w-full object-cover object-top" />
        </Celular>
      </div>
      <Codigo titulo="O que o app envia" linhas={json(RELATO)} />
    </div>
  );
}

function VisualBotao() {
  const [apertos, setApertos] = useState(0);
  const [aceso, setAceso] = useState(false);

  const apertar = () => {
    setApertos((n) => n + 1);
    setAceso(true);
  };
  useEffect(() => {
    const t = setTimeout(apertar, 900);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!aceso) return;
    const t = setTimeout(() => setAceso(false), 1600);
    return () => clearTimeout(t);
  }, [aceso, apertos]);

  const linhas = ['Wi-Fi Wokwi-GUEST conectado', 'Aguardando o botão...'];
  if (apertos > 0) linhas.push('Botão apertado! Relato montado:', ...json(RELATO_IOT), 'POST /api/relatos', 'LED aceso: relato enviado');

  return (
    <div className="grid w-full items-center gap-10 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:gap-5">
      <div className="relative mx-auto aspect-[220/150] w-full max-w-[300px]">
        <svg viewBox="0 0 220 150" className="h-full w-full" aria-hidden="true">
          <rect x="10" y="10" width="200" height="130" rx="12" fill="#14324f" />
          {Array.from({ length: 15 }, (_, i) => (
            <g key={i} fill="#d6b04a">
              <rect x={22 + i * 12.5} y="14" width="5" height="8" rx="1" />
              <rect x={22 + i * 12.5} y="128" width="5" height="8" rx="1" />
            </g>
          ))}
          <rect x="34" y="44" width="64" height="62" rx="5" fill="#0a1a2a" />
          <text x="66" y="79" textAnchor="middle" fontSize="11" fill="#b0dcfc" fontFamily="monospace">
            ESP32
          </text>
          <circle cx="140" cy="48" r="14" fill="#3ddc84" opacity={aceso ? 0.3 : 0} style={{ transition: 'opacity 200ms' }} />
          <circle cx="140" cy="48" r="7" fill={aceso ? '#3ddc84' : '#1f4a35'} style={{ transition: 'fill 200ms' }} />
          <text x="156" y="52" fontSize="9" fill="#b0dcfc" fontFamily="monospace">
            LED
          </text>
          <rect x="140" y="80" width="40" height="40" rx="6" fill="#0a1a2a" />
        </svg>
        <motion.button
          type="button"
          onClick={apertar}
          whileTap={{ scale: 0.82 }}
          aria-label="Apertar o botão de pânico"
          className="absolute top-[66.7%] left-[72.7%] h-[17%] w-[12%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-alto shadow-[0_4px_0_#7f1d14] active:shadow-none"
        />
        <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[13px] whitespace-nowrap text-suave">Aperte o botão vermelho</p>
      </div>
      <Codigo key={apertos} titulo="Monitor serial" linhas={linhas} />
    </div>
  );
}

const ROTAS: [string, string][] = [
  ['GET', '/api/health'],
  ['GET', '/api/relatos?bairro=&tipo=&status='],
  ['GET', '/api/relatos/{id}'],
  ['POST', '/api/relatos'],
  ['PATCH', '/api/relatos/{id}/status'],
  ['GET', '/api/previsoes?bairro='],
];
const COR_METODO: Record<string, string> = {
  GET: 'bg-baixo-suave text-sobre-baixo',
  POST: 'bg-celeste text-forte',
  PATCH: 'bg-medio-suave text-sobre-medio',
};

function VisualApi() {
  const [valido, setValido] = useState(true);
  const corpo = { tipo: valido ? 'celular' : 'carro', latitude: -23.561, longitude: -46.656, bairro: 'bela_vista' };
  const resposta = valido ? { id: '3f2b6c1e-8a4d-…', tipo: 'celular', status: 'pendente' } : { erro: 'tipo inválido: carro' };

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <div className="flex gap-1.5" role="group" aria-label="Tipo de pedido">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            type="button"
            aria-pressed={valido === v}
            onClick={() => setValido(v)}
            className={`rounded-full px-4 py-2 text-[14px] font-medium transition-colors ${valido === v ? 'bg-marinho text-white' : 'bg-superficie text-forte hover:bg-nevoa'}`}
          >
            {v ? 'Relato válido' : 'Relato inválido'}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Codigo key={`p${valido}`} titulo="POST /api/relatos" linhas={json(corpo)} />
        <Codigo key={`r${valido}`} titulo={valido ? 'Resposta · 201 Created' : 'Resposta · 400 Bad Request'} linhas={json(resposta)} />
      </div>
      <ul className="grid gap-1 rounded-[18px] bg-superficie p-3 text-[13px]">
        {ROTAS.map(([metodo, rota]) => (
          <li key={metodo + rota} className={`flex items-center gap-3 rounded-lg px-2 py-1 ${metodo === 'POST' ? 'bg-nevoa' : ''}`}>
            <span className={`w-14 shrink-0 rounded-full py-0.5 text-center text-[11px] font-bold ${COR_METODO[metodo]}`}>{metodo}</span>
            <span className="truncate font-mono text-forte">{rota}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type Situacao = 'pendente' | 'aprovado' | 'rejeitado';
const PENDENTES = [
  { id: 1, texto: 'Celular · Bela Vista', quando: 'Hoje, 21:35' },
  { id: 2, texto: 'Bicicleta · Mooca', quando: 'Hoje, 18:10' },
  { id: 3, texto: 'Outro · Consolação (iot)', quando: 'Hoje, 07:52' },
];
const SELO_SITUACAO: Record<Situacao, string> = {
  pendente: 'bg-medio-suave text-sobre-medio',
  aprovado: 'bg-baixo-suave text-sobre-baixo',
  rejeitado: 'bg-alto-suave text-sobre-alto',
};

function VisualModeracao() {
  const [situacao, setSituacao] = useState<Record<number, Situacao>>({});
  const [ultimo, setUltimo] = useState<string | null>(null);
  const atual = useRef(situacao);
  atual.current = situacao;

  const decidir = (id: number, s: Situacao) => {
    setSituacao((antes) => ({ ...antes, [id]: s }));
    const r = PENDENTES.find((p) => p.id === id);
    if (r) setUltimo(`${r.texto}: ${s === 'aprovado' ? 'aprovado, vai para o mapa' : 'rejeitado, não aparece para ninguém'}.`);
  };
  // Sozinho, o moderador aprova um e rejeita outro; o terceiro fica para quem visita.
  useEffect(() => {
    const a = setTimeout(() => !atual.current[1] && decidir(1, 'aprovado'), 1400);
    const b = setTimeout(() => !atual.current[2] && decidir(2, 'rejeitado'), 3000);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const contar = (s: Situacao) => PENDENTES.filter((p) => (situacao[p.id] ?? 'pendente') === s).length;

  return (
    <div className="w-full overflow-hidden rounded-[18px] bg-superficie shadow-[0_24px_48px_-28px_rgb(7_29_54/0.5)]">
      <div className="flex items-center gap-2 bg-nevoa px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-alto" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-medio" aria-hidden="true" />
        <span className="h-2.5 w-2.5 rounded-full bg-baixo" aria-hidden="true" />
        <p className="ml-2 text-[13px] font-medium text-forte">Moderação de relatos · C#</p>
      </div>
      <ul className="grid gap-2 p-3">
        {PENDENTES.map((p) => {
          const s = situacao[p.id] ?? 'pendente';
          return (
            <motion.li layout key={p.id} className="flex flex-wrap items-center gap-3 rounded-[14px] bg-fundo px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-forte">{p.texto}</p>
                <p className="text-[12px] text-suave">{p.quando}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium capitalize ${SELO_SITUACAO[s]}`}>{s}</span>
              {s === 'pendente' ? (
                <span className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => decidir(p.id, 'aprovado')}
                    aria-label={`Aprovar ${p.texto}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-baixo text-white transition-transform active:scale-90"
                  >
                    <Check size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => decidir(p.id, 'rejeitado')}
                    aria-label={`Rejeitar ${p.texto}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-alto text-white transition-transform active:scale-90"
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </span>
              ) : null}
            </motion.li>
          );
        })}
      </ul>
      <div className="border-t border-linha px-4 py-3 text-[13px]">
        <p className="text-suave">
          {contar('pendente')} pendente · {contar('aprovado')} aprovado · {contar('rejeitado')} rejeitado
        </p>
        <AnimatePresence mode="wait">
          {ultimo ? (
            <motion.p key={ultimo} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1 font-medium text-forte">
              {ultimo}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function VisualModelo() {
  const [faixa, setFaixa] = useState<Faixa>('noite');
  const previsao = previsaoDe(LUGAR_EXEMPLO.codigo, faixa);
  const nivel = previsao?.nivel_risco ?? 'baixo';
  const score = previsao?.score ?? 0;

  return (
    <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Faixa do dia">
        {FAIXAS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={f === faixa}
            onClick={() => setFaixa(f)}
            className={`rounded-full py-2 text-[14px] font-medium transition-colors ${f === faixa ? 'bg-marinho text-white' : 'bg-superficie text-forte hover:bg-nevoa'}`}
          >
            {ROTULO_FAIXA[f]}
          </button>
        ))}
      </div>
      <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <div className="rounded-[18px] bg-superficie p-4">
          <p className="text-[13px] font-medium text-suave">Entradas</p>
          <dl className="mt-2 grid gap-1.5 text-[14px]">
            {[
              ['Lugar', LUGAR_EXEMPLO.nome],
              ['Faixa', ROTULO_FAIXA[faixa]],
              ['Dia', 'útil'],
              ['Histórico', `${decimal(taxaDe(LUGAR_EXEMPLO.codigo, faixa))} roubos/dia`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-suave">{k}</dt>
                <dd className="truncate text-right font-medium text-forte">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <span className="flex items-center justify-center text-suave" aria-hidden="true">
          <ArrowRight size={20} className="max-sm:rotate-90" />
        </span>
        <div className="flex flex-col justify-between rounded-[18px] bg-marinho p-4 text-white">
          <p className="flex items-center gap-2 text-[15px] font-medium">
            <TreePine size={18} aria-hidden="true" /> RandomForest
          </p>
          <div className="mt-3">
            <p className="text-[13px] text-claro">score de risco</p>
            <p className="text-[34px] leading-none font-medium tabular-nums">{score.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white/15">
              <motion.span
                className="block h-full rounded-full"
                style={{ backgroundColor: COR_NIVEL[nivel] }}
                initial={false}
                animate={{ width: `${score * 100}%` }}
                transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
              />
            </span>
            <p className="mt-2 text-[13px] text-claro">F1 macro de {RESUMO.modelo.f1.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} no teste de 2026</p>
          </div>
        </div>
      </div>
      <span className="flex justify-center text-suave" aria-hidden="true">
        <ArrowDown size={20} />
      </span>
      <Codigo key={faixa} titulo={`Saída em previsoes.json · risco ${ROTULO_NIVEL[nivel].toLowerCase()}`} linhas={json(previsao ?? {})} />
    </div>
  );
}

const NO_MAPA = [
  'Relatos aprovados viram pinos no mapa',
  'A cor de cada lugar vem da previsão do modelo',
  'Trocar a faixa do dia recolore a região',
  'Sem internet, o app usa a cópia local das previsões',
];

function VisualMapa() {
  return (
    <div className="grid w-full items-center gap-6 sm:grid-cols-[190px_1fr]">
      <div className="mx-auto w-[180px]">
        <Celular>
          <img src="/app/mapa-relato.webp" alt="Mapa do app com um relato aberto" className="h-full w-full object-cover object-top" />
        </Celular>
      </div>
      <ul className="grid gap-2">
        {NO_MAPA.map((t, i) => (
          <motion.li
            key={t}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 * i, duration: 0.35 }}
            className="rounded-[16px] bg-superficie px-4 py-3 text-[15px] font-medium text-forte"
          >
            {t}
          </motion.li>
        ))}
        <li className="flex flex-wrap gap-2 pt-1">
          {(['alto', 'medio', 'baixo'] as const).map((n) => (
            <span key={n} className="flex items-center gap-2 rounded-full bg-superficie px-3 py-1.5 text-[13px] text-forte">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_NIVEL[n] }} aria-hidden="true" />
              Risco {ROTULO_NIVEL[n].toLowerCase()}
            </span>
          ))}
        </li>
      </ul>
    </div>
  );
}

interface Etapa {
  icone: LucideIcon;
  nome: string;
  parte: string;
  pasta: string;
  pronta: boolean;
  texto: string;
  fatos: string[];
  nota?: string;
  Visual: () => ReactNode;
}

const ETAPAS: Etapa[] = [
  {
    icone: MessageSquarePlus,
    nome: 'Relato',
    parte: 'App do cidadão',
    pasta: 'mobile/',
    pronta: true,
    texto: 'O morador conta o que houve: o tipo, o local aproximado e a hora. Sem nome, sem documento, sem placa.',
    fatos: ['Coordenadas com só 3 casas decimais', 'Sem rede, o relato espera e é enviado depois', 'Descrição opcional, até 280 caracteres'],
    Visual: VisualRelato,
  },
  {
    icone: Siren,
    nome: 'Botão de pânico',
    parte: 'ESP32 no Wokwi',
    pasta: 'physical/',
    pronta: false,
    texto: 'Num ponto de ônibus, um aperto monta o mesmo relato, com origem iot e o local fixo do ponto.',
    fatos: ['Mesmo formato de relato do app', 'Conecta pelo Wi-Fi Wokwi-GUEST', 'O LED confirma o envio'],
    Visual: VisualBotao,
  },
  {
    icone: Database,
    nome: 'API e banco',
    parte: 'ASP.NET Core e SQLite',
    pasta: 'soa/',
    pronta: false,
    texto: 'A API valida o relato, guarda como pendente e responde 201. Se algo vier errado, responde 400 com o motivo.',
    fatos: ['Consultas só pelo Entity Framework, nunca SQL montado', 'Banco versionado com migrations', 'Hospedada no IIS do Windows Server'],
    Visual: VisualApi,
  },
  {
    icone: ShieldCheck,
    nome: 'Moderação',
    parte: 'App em C#',
    pasta: 'csharp/',
    pronta: false,
    texto: 'O moderador revisa os relatos pendentes e aprova ou rejeita. Só os aprovados aparecem no mapa.',
    fatos: ['Um tipo de roubo por classe, com polimorfismo', 'Cidadão e Moderador como usuários', 'Filtra por tipo, lugar e situação'],
    nota: 'Hoje o app em C# roda à parte, com relatos em memória.',
    Visual: VisualModeracao,
  },
  {
    icone: BrainCircuit,
    nome: 'Modelo de risco',
    parte: 'RandomForest em Python',
    pasta: 'ia/',
    pronta: true,
    texto: 'Treinado com os roubos reais da SSP-SP, o modelo dá o nível de risco de cada lugar em cada faixa do dia.',
    fatos: ['129 lugares e 4 faixas do dia', 'Dia útil e fim de semana separados', 'Exporta previsoes.json para a API e o app'],
    Visual: VisualModelo,
  },
  {
    icone: MapPinned,
    nome: 'Mapa',
    parte: 'De volta ao app',
    pasta: 'mobile/',
    pronta: true,
    texto: 'Os relatos aprovados e o risco previsto aparecem no mapa de todo mundo, faixa por faixa do dia.',
    fatos: ['Busca por bairro ou cidade', 'Aba de risco com os maiores do momento', 'Tema claro e escuro'],
    Visual: VisualMapa,
  },
];

export function Fluxo() {
  const ref = useRef<HTMLElement>(null);
  const visto = useInView(ref, { amount: 0.35 });
  const semMovimento = useReducedMotion();
  const [ativa, setAtiva] = useState(0);
  const [automatico, setAutomatico] = useState(true);
  const [lendo, setLendo] = useState(false);
  const rodando = automatico && visto && !lendo && !semMovimento;

  useEffect(() => {
    if (!rodando) return;
    const t = setTimeout(() => setAtiva((a) => (a + 1) % ETAPAS.length), DURACAO);
    return () => clearTimeout(t);
  }, [rodando, ativa]);

  const escolher = (i: number) => {
    setAtiva(i);
    setAutomatico(false);
  };
  const e = ETAPAS[ativa];

  return (
    <section ref={ref} className="margem">
      <Surgir>
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ETAPAS.map((etapa, i) => {
            const atual = i === ativa;
            return (
              <li key={etapa.nome}>
                <button
                  type="button"
                  onClick={() => escolher(i)}
                  aria-current={atual ? 'step' : undefined}
                  className={`relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-[20px] p-3.5 text-left transition-colors duration-300 sm:p-4 ${
                    atual ? 'bg-marinho text-white' : 'bg-superficie text-forte hover:bg-nevoa'
                  }`}
                >
                  <span className="flex w-full items-center justify-between">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ${
                        atual ? 'bg-azul text-white' : i < ativa ? 'bg-celeste' : 'bg-nevoa'
                      }`}
                    >
                      <etapa.icone size={17} aria-hidden="true" />
                    </span>
                    <span className={`text-[13px] font-medium tabular-nums ${atual ? 'text-claro' : 'text-suave'}`}>0{i + 1}</span>
                  </span>
                  <span className="text-[15px] leading-tight font-medium sm:text-[16px]">{etapa.nome}</span>
                  {atual ? (
                    <motion.span
                      key={`${ativa}-${rodando}`}
                      className="absolute inset-x-0 bottom-0 h-1 origin-left bg-azul"
                      initial={{ scaleX: rodando ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: rodando ? DURACAO / 1000 : 0, ease: 'linear' }}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>

        <div onPointerEnter={() => setLendo(true)} onPointerLeave={() => setLendo(false)} className="mt-3 rounded-bloco bg-superficie p-3 lg:min-h-[600px]">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={ativa}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:min-h-[576px] lg:grid-cols-12"
            >
              <div className="flex flex-col p-4 text-forte lg:col-span-5 lg:p-7">
                <p className="text-[14px] text-suave">
                  Etapa {ativa + 1} de {ETAPAS.length}
                </p>
                <h3 className="mt-2 text-[34px] leading-[1.05] font-medium tracking-[-0.02em]">{e.nome}</h3>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px]">
                  <span className="rounded-full bg-nevoa px-3 py-1 font-medium">
                    {e.parte} · {e.pasta}
                  </span>
                  <span className={`rounded-full px-3 py-1 font-medium ${e.pronta ? 'bg-baixo-suave text-sobre-baixo' : 'bg-fundo text-suave'}`}>
                    {e.pronta ? 'Pronta' : 'Em construção'}
                  </span>
                </p>
                <p className="mt-5 text-[18px] leading-relaxed text-tinta">{e.texto}</p>
                <ul className="mt-5 grid gap-2 text-[16px]">
                  {e.fatos.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check size={18} className="mt-0.5 shrink-0 text-azul" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
                {e.nota ? <p className="mt-5 rounded-[16px] bg-fundo px-4 py-3 text-[15px] text-suave">{e.nota}</p> : null}
                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  <button
                    type="button"
                    onClick={() => escolher((ativa + ETAPAS.length - 1) % ETAPAS.length)}
                    className="botao min-h-11 bg-fundo text-forte hover:bg-nevoa"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => escolher((ativa + 1) % ETAPAS.length)}
                    className="botao min-h-11 bg-azul text-white hover:bg-azul-escuro"
                  >
                    Próxima etapa <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="flex min-h-[420px] min-w-0 items-center justify-center rounded-[22px] bg-fundo p-4 sm:p-6 lg:col-span-7 [&>*]:min-w-0" data-ui>
                <e.Visual />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </Surgir>
    </section>
  );
}
