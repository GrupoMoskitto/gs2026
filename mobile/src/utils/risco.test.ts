import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resumoDoModelo } from '@/services/modelo';
import type { PrevisaoRisco } from '@/types/dominio';
import { formatarDecimal, formatarInteiro, formatarParte, mesCurto, mesPorExtenso } from './numeros';
import { contarNiveis, extremos, horaDePico, maioresRiscos, rotuloDaHora } from './risco';

const P = (bairro: string, nivel_risco: PrevisaoRisco['nivel_risco'], score: number): PrevisaoRisco => ({
  bairro, faixa_horaria: 'noite', nivel_risco, score,
});

describe('aba Risco', () => {
  it('formata números em português', () => {
    assert.equal(formatarInteiro(239088), '239.088');
    assert.equal(formatarInteiro(512), '512');
    assert.equal(formatarDecimal(2.774), '2,8');
    assert.equal(formatarParte(0.564), '56%');
    assert.equal(mesPorExtenso('2026-11'), 'novembro de 2026');
    assert.equal(mesCurto('2024-01-01'), 'jan/2024');
  });

  it('conta os níveis e ordena os maiores riscos pelo nível e depois pela nota', () => {
    const lista = [P('a', 'medio', 0.59), P('b', 'alto', 0.6), P('c', 'alto', 0.9), P('d', 'baixo', 0.1)];
    assert.deepEqual(contarNiveis(lista, 'noite'), { baixo: 1, medio: 1, alto: 2 });
    assert.deepEqual(maioresRiscos(lista, 'noite', 3).map((p) => p.bairro), ['c', 'b', 'a']);
    assert.deepEqual(contarNiveis(lista, 'manha'), { baixo: 0, medio: 0, alto: 0 });
    const empate = [P('x', 'alto', 0.95), P('y', 'alto', 0.95)];
    assert.deepEqual(maioresRiscos(empate, 'noite', 2, (b) => (b === 'y' ? 3 : 1)).map((p) => p.bairro), ['y', 'x']);
  });

  it('acha a faixa mais e menos arriscada e a hora de pico', () => {
    assert.deepEqual(extremos([1.9, 1.6, 1.4, 2.8]), { maior: 'noite', menor: 'tarde' });
    assert.equal(horaDePico([1, 5, 3, 5]), 1);
    assert.equal(rotuloDaHora(20), '20h às 21h');
    assert.equal(rotuloDaHora(0), '0h à 1h');
    assert.equal(rotuloDaHora(23), '23h à 0h');
  });

  it('o resumo do modelo tem cada lugar com as 4 faixas e as 24 horas', () => {
    const r = resumoDoModelo();
    assert.equal(Object.keys(r.lugares).length, 129);
    for (const l of Object.values(r.lugares)) assert.equal(l.taxa.length, 4);
    assert.equal(r.horas.length, 24);
  });
});
