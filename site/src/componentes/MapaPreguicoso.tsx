import { lazy, Suspense, type ComponentProps } from 'react';

import type { MapaRisco as Mapa } from './MapaRisco';

// O Leaflet vem num arquivo separado, para não atrasar a primeira pintura da página.
const MapaRisco = lazy(() => import('./MapaRisco').then((m) => ({ default: m.MapaRisco })));

export function MapaPreguicoso(props: ComponentProps<typeof Mapa>) {
  return (
    <Suspense fallback={<div className="h-full w-full bg-[#e6eef4] dark:bg-[#0f2236]" />}>
      <MapaRisco {...props} />
    </Suspense>
  );
}
