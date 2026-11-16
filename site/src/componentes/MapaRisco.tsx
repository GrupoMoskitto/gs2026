import { Browser, DomEvent, canvas } from 'leaflet';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';

import { COR_NIVEL, LUGARES, ROTULO_NIVEL, nivelDe, type Faixa, type Lugar } from '../dados';

function Seguir({ lugar }: { lugar: Lugar | null }) {
  const mapa = useMap();
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);
  useEffect(() => {
    if (!lugar) return;
    mapa.flyTo([lugar.lat, lugar.lng], Math.max(mapa.getZoom(), 11), {
      duration: 0.8,
    });
  }, [mapa, lugar]);
  return null;
}

const CENTRO: [number, number] = [-23.58, -46.62];

/** Botões de zoom da simulação. A roda do mouse só dá zoom depois de um clique no mapa, para não prender a rolagem da página. */
const TOQUE = canvas({ tolerance: 12 });

/** No celular, um dedo rola a página; ao tentar arrastar o mapa com um dedo, avisa que são dois. */
function DicaDoisDedos() {
  const mapa = useMap();
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = mapa.getContainer();
    let relogio = 0;
    const mover = (e: TouchEvent) => {
      if (e.touches.length !== 1) return setVisivel(false);
      setVisivel(true);
      clearTimeout(relogio);
      relogio = window.setTimeout(() => setVisivel(false), 1200);
    };
    el.addEventListener('touchmove', mover, { passive: true });
    return () => {
      el.removeEventListener('touchmove', mover);
      clearTimeout(relogio);
    };
  }, [mapa]);
  return (
    <p
      className={`pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center bg-marinho/55 px-6 text-center text-[13px] font-medium text-white transition-opacity duration-200 ${visivel ? 'opacity-100' : 'opacity-0'}`}
      aria-hidden="true"
    >
      Use dois dedos para mover o mapa
    </p>
  );
}

function Zoom() {
  const mapa = useMap();
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (caixa.current) DomEvent.disableClickPropagation(caixa.current);
    const ligar = () => mapa.scrollWheelZoom.enable();
    const desligar = () => mapa.scrollWheelZoom.disable();
    mapa.on('click dragstart', ligar);
    mapa.getContainer().addEventListener('mouseleave', desligar);
    return () => {
      mapa.off('click dragstart', ligar);
      mapa.getContainer().removeEventListener('mouseleave', desligar);
    };
  }, [mapa]);

  const botao =
    'flex h-7 w-7 items-center justify-center rounded-full bg-superficie text-forte shadow-[0_4px_10px_-4px_rgb(7_29_54/0.5)] transition-transform active:scale-90';
  return (
    <div ref={caixa} className="absolute top-1/2 right-2 z-[1000] grid -translate-y-1/2 gap-1.5">
      <button type="button" aria-label="Aproximar o mapa" onClick={() => mapa.zoomIn()} className={botao}>
        <Plus size={14} aria-hidden="true" />
      </button>
      <button type="button" aria-label="Afastar o mapa" onClick={() => mapa.zoomOut()} className={botao}>
        <Minus size={14} aria-hidden="true" />
      </button>
      <button
        type="button"
        aria-label="Voltar à visão da região"
        data-demo="regiao"
        onClick={() => mapa.flyTo(CENTRO, 10, { duration: 0.6 })}
        className={botao}
      >
        <LocateFixed size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

interface Props {
  faixa: Faixa;
  escolhido: Lugar | null;
  aoEscolher: (l: Lugar) => void;
  /** Versão para a simulação do app: pontos menores, sem controles e sem arrastar no toque. */
  compacto?: boolean;
}

export function MapaRisco({ faixa, escolhido, aoEscolher, compacto = false }: Props) {
  return (
    <MapContainer
      center={compacto ? CENTRO : [-23.6, -46.6]}
      zoom={10}
      minZoom={9}
      maxZoom={compacto ? 16 : 14}
      scrollWheelZoom={false}
      zoomControl={!compacto}
      attributionControl={!compacto}
      dragging={!compacto || !Browser.mobile}
      renderer={compacto ? TOQUE : undefined}
      className="isolate z-0 h-full w-full"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {LUGARES.map((l) => {
        const nivel = nivelDe(l.codigo, faixa);
        const ativo = l.codigo === escolhido?.codigo;
        return (
          <CircleMarker
            key={l.codigo}
            center={[l.lat, l.lng]}
            radius={compacto ? (ativo ? 8 : Browser.mobile ? 5.5 : 4.5) : ativo ? 13 : 7}
            pathOptions={{
              fillColor: COR_NIVEL[nivel],
              fillOpacity: 1,
              color: ativo ? '#071D36' : '#FFFFFF',
              weight: compacto ? (ativo ? 3 : 1.2) : ativo ? 4 : 2,
            }}
            eventHandlers={{ click: () => aoEscolher(l) }}
          >
            {compacto ? null : (
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>{l.nome}</strong> · risco {ROTULO_NIVEL[nivel].toLowerCase()}
              </Tooltip>
            )}
          </CircleMarker>
        );
      })}
      <Seguir lugar={escolhido} />
      {compacto ? <Zoom /> : null}
      {compacto && Browser.mobile ? <DicaDoisDedos /> : null}
    </MapContainer>
  );
}
