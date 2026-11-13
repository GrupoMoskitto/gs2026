import { StyleSheet, View } from 'react-native';

import { coresDoRisco, coresDoStatus, raio, useTema } from '@/theme';
import type { NivelRisco, StatusRelato } from '@/types/dominio';
import { ROTULO_RISCO, ROTULO_STATUS } from '@/utils/rotulos';
import { Icone, type NomeIcone } from './Icone';
import { Texto } from './Texto';

const ICONE_RISCO: Record<NivelRisco, NomeIcone> = {
  baixo: 'shield-checkmark',
  medio: 'warning',
  alto: 'alert-circle',
};

const ICONE_STATUS: Record<StatusRelato, NomeIcone> = {
  aprovado: 'checkmark',
  pendente: 'time-outline',
  rejeitado: 'close',
};

export function SeloRisco({ nivel }: { nivel: NivelRisco }) {
  const { cores } = useTema();
  const c = coresDoRisco(cores, nivel);
  return (
    <View style={[estilos.selo, { backgroundColor: c.suave }]} accessible accessibilityLabel={`Risco ${ROTULO_RISCO[nivel].toLowerCase()}`}>
      <Icone nome={ICONE_RISCO[nivel]} tamanho={14} cor={c.sobre} />
      <Texto variante="legendaForte" cor={c.sobre}>{`Risco ${ROTULO_RISCO[nivel].toLowerCase()}`}</Texto>
    </View>
  );
}

export function SeloStatus({ status }: { status: StatusRelato }) {
  const { cores } = useTema();
  const c = coresDoStatus(cores, status);
  return (
    <View style={[estilos.selo, { backgroundColor: c.suave }]} accessible accessibilityLabel={`Status: ${ROTULO_STATUS[status]}`}>
      <Icone nome={ICONE_STATUS[status]} tamanho={14} cor={c.sobre} />
      <Texto variante="legendaForte" cor={c.sobre}>
        {ROTULO_STATUS[status]}
      </Texto>
    </View>
  );
}

const estilos = StyleSheet.create({
  selo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: raio.pilula,
  },
});
