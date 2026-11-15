import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ErroApi } from '@/services/erro';
import type { ResumoEnvio } from '@/services/fila';
import type { Relato } from '@/types/dominio';
import { avisoDoEnvio } from './avisoEnvio';

const RELATO: Relato = {
  id: 'x', tipo: 'celular', latitude: -23.561, longitude: -46.656, bairro: 'bela_vista',
  ocorrido_em: '2026-11-10T21:35:00-03:00', status: 'pendente', origem: 'mobile',
};
const OK: ResumoEnvio = { enviados: [], restantes: 0, recusados: 0, motivoRecusa: null, erro: null };

describe('aviso do "Enviar agora"', () => {
  it('não avisa quando tudo foi enviado', () => {
    assert.equal(avisoDoEnvio({ ...OK, enviados: [RELATO] }), null);
  });

  it('avisa o erro de rede e diz que os relatos continuam guardados', () => {
    const aviso = avisoDoEnvio({ ...OK, restantes: 2, erro: new ErroApi('rede', 'Sem conexão com o servidor.') });
    assert.equal(aviso?.titulo, 'Não foi possível enviar');
    assert.match(aviso?.texto ?? '', /Sem conexão com o servidor\. Os 2 relatos que faltam continuam guardados/);
  });

  it('conta os enviados antes da falha', () => {
    const aviso = avisoDoEnvio({ ...OK, enviados: [RELATO], restantes: 1, erro: new ErroApi('tempo_limite', 'A conexão está lenta. Tente de novo.') });
    assert.match(aviso?.texto ?? '', /^1 relato enviado\. A conexão está lenta\. Tente de novo\. O relato que falta/);
  });

  it('avisa o relato recusado com o motivo do servidor', () => {
    const aviso = avisoDoEnvio({ ...OK, recusados: 1, motivoRecusa: 'Coordenada fora da região.' });
    assert.equal(aviso?.titulo, 'Relato recusado');
    assert.match(aviso?.texto ?? '', /recusou 1 relato, que saiu da fila\. Motivo: Coordenada fora da região\./);
  });
});
