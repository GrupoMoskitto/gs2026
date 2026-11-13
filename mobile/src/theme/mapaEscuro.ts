// Estilo escuro do Google Maps (Android). No iOS o Apple Maps usa `userInterfaceStyle`.
// Esconde também os comércios, para o mapa ficar mais limpo e os pontos do app aparecerem.
import type { ComponentProps } from 'react';
import type MapView from 'react-native-maps';

type EstiloMapa = NonNullable<ComponentProps<typeof MapView>['customMapStyle']>;

export const ESTILO_MAPA_ESCURO: EstiloMapa = [
  { elementType: 'geometry', stylers: [{ color: '#16212c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9fb1c2' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b1520' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3c50' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3b4856' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1520' }] },
];

export const ESTILO_MAPA_CLARO: EstiloMapa = [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }];
