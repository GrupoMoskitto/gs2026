import { Redirect } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';

import { useSessao } from '@/hooks/SessaoContexto';
import { useTema } from '@/theme';

/**
 * Barra de abas nativa do sistema: UITabBar com o vidro do iOS 26 e o Material no Android.
 * Cada aba é uma pasta com a sua própria pilha, que dá o cabeçalho nativo.
 */
export default function AbasLayout() {
  const { cores } = useTema();
  const { sessao } = useSessao();

  // Sem identificação (por exemplo, depois de "Sair da conta"), volta para a tela de identificação.
  if (sessao === null) return <Redirect href="/identificacao" />;

  return (
    <NativeTabs
      tintColor={cores.primaria}
      iconColor={{ default: cores.textoSuave, selected: cores.primaria }}
      labelStyle={{
        default: { color: cores.textoSuave, fontSize: 11 },
        selected: { color: cores.primaria, fontSize: 11 },
      }}
      backgroundColor={cores.superficie}
      indicatorColor={cores.primariaSuave}
    >
      <NativeTabs.Trigger name="mapa">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
        <NativeTabs.Trigger.Label>Mapa</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="relatos">
        <NativeTabs.Trigger.Icon sf={{ default: 'list.bullet', selected: 'list.bullet.rectangle.fill' }} md="list" />
        <NativeTabs.Trigger.Label>Relatos</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="risco">
        <NativeTabs.Trigger.Icon sf={{ default: 'exclamationmark.shield', selected: 'exclamationmark.shield.fill' }} md="shield" />
        <NativeTabs.Trigger.Label>Risco</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="ajustes">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} md="settings" />
        <NativeTabs.Trigger.Label>Ajustes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
