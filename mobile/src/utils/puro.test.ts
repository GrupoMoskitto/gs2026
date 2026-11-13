import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LUGARES, lugarDe, nomeDoLugar } from '@/config/locais';
import { gerarPrevisoesExemplo, gerarRelatosExemplo } from '@/services/exemplos';
import { calcularEspera, statusRepetivel } from '@/services/retry';
import { buscarLocais, normalizar } from './busca';
import { arredondar3, bairroMaisProximo, dentroDaRegiao } from './geo';
import { dataDeOpcao, faixaDaHora, formatarDia, formatarHora, isoSaoPaulo } from './tempo';
import { validarIdentificacao, validarNovoRelato, type EntradaRelato } from './validacao';

const AGORA = new Date('2026-11-12T22:00:00-03:00');

function entradaValida(): EntradaRelato {
  return {
    tipo: 'celular',
    bairro: 'bela_vista',
    descricao: '  Levaram meu celular  ',
    latitude: -23.5613,
    longitude: -46.6563,
    ocorridoEm: new Date('2026-11-12T21:00:00-03:00'),
  };
}

describe('geo', () => {
  it('arredonda para 3 casas', () => {
    assert.equal(arredondar3(-23.56137), -23.561);
    assert.equal(arredondar3(-46.6566), -46.657);
  });
  it('reconhece pontos dentro e fora da região', () => {
    assert.equal(dentroDaRegiao({ latitude: -23.5613, longitude: -46.6563 }), true);
    assert.equal(dentroDaRegiao({ latitude: -22.9, longitude: -43.2 }), false);
  });
  it('acha o bairro mais próximo', () => {
    assert.equal(bairroMaisProximo({ latitude: -23.5545, longitude: -46.66 }), 'consolacao');
    assert.equal(bairroMaisProximo({ latitude: -23.5615, longitude: -46.6535 }), 'bela_vista');
  });
});

describe('tempo', () => {
  it('monta a ISO com fuso -03:00', () => {
    assert.equal(isoSaoPaulo(new Date('2026-11-10T21:35:00-03:00')), '2026-11-10T21:35:00-03:00');
    assert.equal(isoSaoPaulo(new Date('2026-11-11T00:35:00Z')), '2026-11-10T21:35:00-03:00');
  });
  it('divide o dia em faixas', () => {
    assert.equal(faixaDaHora(0), 'madrugada');
    assert.equal(faixaDaHora(5), 'madrugada');
    assert.equal(faixaDaHora(6), 'manha');
    assert.equal(faixaDaHora(12), 'tarde');
    assert.equal(faixaDaHora(18), 'noite');
    assert.equal(faixaDaHora(23), 'noite');
  });
  it('formata hora e dia', () => {
    assert.equal(formatarHora('2026-11-10T21:35:00-03:00'), '21h35');
    assert.equal(formatarDia('2026-11-12T10:00:00-03:00', AGORA), 'Hoje');
    assert.equal(formatarDia('2026-11-11T10:00:00-03:00', AGORA), 'Ontem');
    assert.equal(formatarDia('2026-11-05T10:00:00-03:00', AGORA), '05/11');
  });
  it('calcula a data das opções rápidas', () => {
    assert.equal(dataDeOpcao('1h', AGORA).getTime(), AGORA.getTime() - 3600000);
  });
});

describe('validarNovoRelato', () => {
  it('aceita uma entrada válida e monta o relato no formato da API', () => {
    const r = validarNovoRelato(entradaValida(), AGORA);
    assert.equal(r.ok, true);
    if (r.ok) {
      assert.equal(r.valor.descricao, 'Levaram meu celular');
      assert.equal(r.valor.origem, 'mobile');
      assert.equal(r.valor.ocorrido_em, '2026-11-12T21:00:00-03:00');
      assert.equal(r.valor.latitude, -23.561);
    }
  });
  it('não envia a descrição quando está vazia', () => {
    const r = validarNovoRelato({ ...entradaValida(), descricao: '   ' }, AGORA);
    assert.equal(r.ok, true);
    if (r.ok) assert.equal('descricao' in r.valor, false);
  });
  it('recusa campos que faltam', () => {
    const r = validarNovoRelato({ ...entradaValida(), tipo: null, bairro: null, latitude: null }, AGORA);
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.erros).sort(), ['bairro', 'local', 'tipo']);
  });
  it('recusa descrição acima de 280 caracteres', () => {
    const r = validarNovoRelato({ ...entradaValida(), descricao: 'a'.repeat(281) }, AGORA);
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.erros.descricao);
  });
  it('recusa local fora da região', () => {
    const r = validarNovoRelato({ ...entradaValida(), latitude: -22.9, longitude: -43.2 }, AGORA);
    assert.equal(r.ok, false);
    if (!r.ok) assert.ok(r.erros.local);
  });
  it('recusa horário no futuro e muito antigo', () => {
    const futuro = validarNovoRelato({ ...entradaValida(), ocorridoEm: new Date(AGORA.getTime() + 3600000) }, AGORA);
    const antigo = validarNovoRelato(
      { ...entradaValida(), ocorridoEm: new Date(AGORA.getTime() - 31 * 86400000) },
      AGORA,
    );
    assert.equal(futuro.ok, false);
    assert.equal(antigo.ok, false);
  });
});

describe('validarIdentificacao', () => {
  it('aceita apelido e RM, com ou sem o prefixo', () => {
    const a = validarIdentificacao('  Coto ', '559579');
    const b = validarIdentificacao('Coto', 'rm559579');
    assert.deepEqual(a, { ok: true, valor: { apelido: 'Coto', rm: 'RM559579' } });
    assert.deepEqual(b, { ok: true, valor: { apelido: 'Coto', rm: 'RM559579' } });
  });
  it('recusa apelido curto e RM inválido', () => {
    const r = validarIdentificacao('C', '12ab');
    assert.equal(r.ok, false);
    if (!r.ok) assert.deepEqual(Object.keys(r.erros).sort(), ['apelido', 'rm']);
  });
});

describe('retry', () => {
  it('dobra a espera a cada tentativa até o teto', () => {
    assert.equal(calcularEspera(0, 1, 500, 8000), 500);
    assert.equal(calcularEspera(1, 1, 500, 8000), 1000);
    assert.equal(calcularEspera(2, 1, 500, 8000), 2000);
    assert.equal(calcularEspera(10, 1, 500, 8000), 8000);
  });
  it('o jitter fica entre metade e o total', () => {
    assert.equal(calcularEspera(1, 0, 500, 8000), 500);
    assert.equal(calcularEspera(1, 0.5, 500, 8000), 750);
  });
  it('só repete em erros temporários do servidor', () => {
    assert.equal(statusRepetivel(503), true);
    assert.equal(statusRepetivel(429), true);
    assert.equal(statusRepetivel(400), false);
    assert.equal(statusRepetivel(404), false);
  });
});

describe('busca de lugares', () => {
  const lugares = [
    { nome: 'Consolação', tipo: 'bairro' as const },
    { nome: 'Estação Consolação', tipo: 'estacao' as const },
    { nome: 'Santa Cecília', tipo: 'distrito' as const },
    { nome: 'Santo André', tipo: 'municipio' as const },
    { nome: 'Jardim Paulista', tipo: 'distrito' as const },
  ];

  it('ignora acentos e maiúsculas', () => {
    assert.equal(normalizar('  Consolação '), 'consolacao');
    assert.equal(buscarLocais(lugares, 'CONSOLACAO')[0]?.nome, 'Consolação');
  });

  it('põe quem começa com o texto antes de quem só contém', () => {
    const nomes = buscarLocais(lugares, 'con').map((l) => l.nome);
    assert.deepEqual(nomes, ['Consolação', 'Estação Consolação']);
  });

  it('acha pela segunda palavra', () => {
    assert.equal(buscarLocais(lugares, 'paulista')[0]?.nome, 'Jardim Paulista');
  });

  it('em empate, bairro vem antes de município', () => {
    const nomes = buscarLocais(lugares, 'santa').map((l) => l.nome);
    assert.equal(nomes[0], 'Santa Cecília');
  });

  it('texto vazio não devolve nada e o limite vale', () => {
    assert.deepEqual(buscarLocais(lugares, '   '), []);
    assert.equal(buscarLocais(lugares, 'a', 2).length, 2);
  });
});

describe('lugares da região metropolitana', () => {
  it('conhece os 3 bairros da Paulista, os distritos e os municípios', () => {
    assert.ok(LUGARES.length > 120);
    assert.equal(lugarDe('consolacao')?.nome, 'Consolação');
    assert.equal(lugarDe('bela_vista')?.tipo, 'bairro');
    assert.equal(nomeDoLugar('codigo_que_nao_existe'), 'Local não identificado');
  });

  it('os códigos não se repetem e a capital inteira não é um lugar de relato', () => {
    assert.equal(new Set(LUGARES.map((l) => l.slug)).size, LUGARES.length);
    assert.equal(LUGARES.some((l) => l.nome === 'São Paulo'), false);
  });

  it('acha o lugar mais próximo fora da Paulista', () => {
    assert.equal(nomeDoLugar(bairroMaisProximo({ latitude: -23.405, longitude: -46.456 })), 'Guarulhos');
    assert.equal(nomeDoLugar(bairroMaisProximo({ latitude: -23.723, longitude: -46.449 })), 'Santo André');
  });

  it('aceita pontos da região metropolitana e recusa os de fora', () => {
    assert.equal(dentroDaRegiao({ latitude: -23.405, longitude: -46.456 }), true);
    assert.equal(dentroDaRegiao({ latitude: -22.9, longitude: -47.06 }), false); // Campinas
    assert.equal(dentroDaRegiao({ latitude: -22.91, longitude: -43.17 }), false); // Rio de Janeiro
  });

  it('as previsões de exemplo cobrem todos os lugares nas 4 faixas', () => {
    assert.equal(gerarPrevisoesExemplo().length, LUGARES.length * 4);
  });

  it('os relatos de exemplo ficam dentro da região e apontam para lugares conhecidos', () => {
    for (const r of gerarRelatosExemplo(220, AGORA)) {
      assert.equal(dentroDaRegiao(r), true, r.id);
      assert.notEqual(lugarDe(r.bairro), null, r.bairro);
    }
  });
});
