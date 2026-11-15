import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import { LUGARES } from '@/config/locais';
import { FAIXAS_HORARIAS, type NivelRisco } from '@/types/dominio';
import { previsoesDoModelo } from './modelo';

function nivelDoScore(score: number): NivelRisco {
  if (score >= 0.6) return 'alto';
  if (score >= 0.35) return 'medio';
  return 'baixo';
}

describe('previsão do modelo guardada no app', () => {
  const previsoes = previsoesDoModelo();

  it('cobre cada lugar do app nas 4 faixas, uma vez só', () => {
    assert.equal(previsoes.length, LUGARES.length * FAIXAS_HORARIAS.length);
    const chaves = new Set(previsoes.map((p) => `${p.bairro}|${p.faixa_horaria}`));
    assert.equal(chaves.size, previsoes.length);
    for (const lugar of LUGARES) {
      for (const faixa of FAIXAS_HORARIAS) assert.ok(chaves.has(`${lugar.slug}|${faixa}`), `${lugar.slug} ${faixa}`);
    }
  });

  it('o nível bate com o score e as três classes aparecem', () => {
    for (const p of previsoes) assert.equal(p.nivel_risco, nivelDoScore(p.score), `${p.bairro} ${p.faixa_horaria}`);
    assert.deepEqual(new Set(previsoes.map((p) => p.nivel_risco)), new Set(['baixo', 'medio', 'alto']));
  });

  for (const arquivo of ['previsoes.json', 'resumo_modelo.json']) {
    it(`${arquivo} é igual ao da ia/ (rode npm run modelo se falhar)`, (t) => {
      const original = join(__dirname, '..', '..', '..', 'ia', 'data', arquivo);
      if (!existsSync(original)) return t.skip('pasta ia/ fora do repositório');
      const copia = join(__dirname, '..', 'data', arquivo);
      assert.deepEqual(JSON.parse(readFileSync(copia, 'utf8')), JSON.parse(readFileSync(original, 'utf8')));
    });
  }
});
