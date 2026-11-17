import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Relato } from '@/types/dominio';
import { aplicarFiltros, contarFiltros, SEM_FILTROS } from './filtros';

const base: Relato = {
  id: '1', tipo: 'celular', latitude: -23.561, longitude: -46.656, bairro: 'bela_vista',
  ocorrido_em: '2026-11-16T21:35:00-03:00', status: 'pendente', origem: 'mobile',
};
const agora = new Date('2026-11-16T23:00:00-03:00');
const relatos: Relato[] = [
  base,
  { ...base, id: '2', tipo: 'bicicleta', status: 'aprovado', origem: 'iot', ocorrido_em: '2026-11-10T08:00:00-03:00' },
  { ...base, id: '3', tipo: 'veiculo', status: 'rejeitado', origem: 'desktop', ocorrido_em: '2026-10-01T03:00:00-03:00' },
];
const ids = (lista: Relato[]) => lista.map((r) => r.id);

describe('filtros de relatos', () => {
  it('sem filtros devolve tudo', () => {
    assert.deepEqual(ids(aplicarFiltros(relatos, SEM_FILTROS, agora)), ['1', '2', '3']);
    assert.equal(contarFiltros(SEM_FILTROS), 0);
  });

  it('combina os grupos', () => {
    const f = { ...SEM_FILTROS, tipos: ['celular', 'bicicleta'] as Relato['tipo'][], status: ['aprovado'] as Relato['status'][] };
    assert.deepEqual(ids(aplicarFiltros(relatos, f, agora)), ['2']);
    assert.equal(contarFiltros(f), 3);
  });

  it('filtra por faixa no horário de São Paulo', () => {
    assert.deepEqual(ids(aplicarFiltros(relatos, { ...SEM_FILTROS, faixas: ['manha'] }, agora)), ['2']);
    assert.deepEqual(ids(aplicarFiltros(relatos, { ...SEM_FILTROS, faixas: ['madrugada'] }, agora)), ['3']);
  });

  it('filtra por período e por origem', () => {
    assert.deepEqual(ids(aplicarFiltros(relatos, { ...SEM_FILTROS, periodo: '24h' }, agora)), ['1']);
    assert.deepEqual(ids(aplicarFiltros(relatos, { ...SEM_FILTROS, periodo: '7d' }, agora)), ['1', '2']);
    assert.deepEqual(ids(aplicarFiltros(relatos, { ...SEM_FILTROS, origens: ['desktop'] }, agora)), ['3']);
  });
});
