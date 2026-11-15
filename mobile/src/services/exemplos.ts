// Dados de exemplo (mock), usados quando a API não responde e não há cópia salva.
// São SIMULADOS: nada aqui é relato real. Gerados com semente fixa, então o resultado é sempre o mesmo.
import { LUGARES, type Lugar } from '@/config/locais';
import { ESTACOES_METRO } from '@/config/regiao';
import {
  FAIXAS_HORARIAS,
  TIPOS_RELATO,
  type FaixaHoraria,
  type Relato,
  type StatusRelato,
  type TipoRelato,
} from '@/types/dominio';
import { arredondar3 } from '@/utils/geo';
import { isoSaoPaulo } from '@/utils/tempo';

function criarSorteio(semente: number) {
  let estado = semente;
  return () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
  };
}

const DESCRICOES: Record<TipoRelato, string[]> = {
  celular: ['Levaram meu celular no ponto de ônibus', 'Celular arrancado da mão na calçada'],
  bolsa_mochila: ['Puxaram a mochila perto da estação', 'Bolsa levada na saída do metrô'],
  veiculo: ['Carro arrombado na rua lateral', 'Moto levada em frente ao prédio'],
  bicicleta: ['Bicicleta levada da ciclofaixa', 'Bike furtada no bicicletário'],
  comercio: ['Assalto em loja perto da avenida', 'Furto em comércio no fim da tarde'],
  outro: ['Ocorrência perto da estação', 'Tentativa de roubo na esquina'],
};

const PESO_FAIXA: Record<FaixaHoraria, number> = { madrugada: 2, manha: 1, tarde: 2, noite: 5 };

// Dados SIMULADOS: onde há mais relatos é uma escolha de exemplo, não uma estatística.
const CENTRO_EXPANDIDO = new Set([
  'Bela Vista', 'Cerqueira César', 'Consolação', 'Sé', 'República', 'Liberdade', 'Bom Retiro', 'Brás', 'Santa Cecília',
  'Pinheiros', 'Jardim Paulista', 'Itaim Bibi', 'Vila Mariana', 'Barra Funda', 'Mooca', 'Santa Efigênia', 'Cambuci',
]);
const MUNICIPIOS_GRANDES = new Set(['Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo', 'São Caetano do Sul', 'Diadema', 'Mauá', 'Barueri']);

function pesoDoLugar(l: Lugar): number {
  if (CENTRO_EXPANDIDO.has(l.nome)) return 6;
  if (l.tipo === 'municipio') return MUNICIPIOS_GRANDES.has(l.nome) ? 2.5 : 0.4;
  return 1;
}

const PESO_TOTAL_LUGARES = LUGARES.reduce((soma, l) => soma + pesoDoLugar(l), 0);

function sortearLugar(sorteio: () => number): Lugar {
  let alvo = sorteio() * PESO_TOTAL_LUGARES;
  for (const l of LUGARES) {
    alvo -= pesoDoLugar(l);
    if (alvo <= 0) return l;
  }
  return LUGARES[LUGARES.length - 1];
}

export function gerarRelatosExemplo(quantidade: number, agora: Date = new Date()): Relato[] {
  const sorteio = criarSorteio(2026);
  const relatos: Relato[] = [];

  for (let i = 0; i < quantidade; i += 1) {
    const lugar = sortearLugar(sorteio);
    const tipo: TipoRelato = TIPOS_RELATO[Math.floor(sorteio() * TIPOS_RELATO.length)];

    let faixa: FaixaHoraria = 'noite';
    let acumulado = 0;
    const total = Object.values(PESO_FAIXA).reduce((a, b) => a + b, 0);
    const alvo = sorteio() * total;
    for (const f of FAIXAS_HORARIAS) {
      acumulado += PESO_FAIXA[f];
      if (alvo <= acumulado) {
        faixa = f;
        break;
      }
    }
    const horaBase = { madrugada: 0, manha: 6, tarde: 12, noite: 18 }[faixa];
    const hora = horaBase + Math.floor(sorteio() * 6);

    const naPaulista = lugar.tipo === 'bairro';
    const centro = naPaulista && sorteio() < 0.6 ? ESTACOES_METRO[Math.floor(sorteio() * ESTACOES_METRO.length)] : lugar;
    const espalhar = naPaulista ? 0.006 : lugar.tipo === 'municipio' ? 0.05 : 0.02;
    const latitude = arredondar3(centro.latitude + (sorteio() - 0.5) * espalhar);
    const longitude = arredondar3(centro.longitude + (sorteio() - 0.5) * espalhar);

    const diasAtras = Math.floor(sorteio() * 20);
    const data = new Date(agora.getTime() - diasAtras * 86400000);
    const sp = new Date(data.getTime() - 3 * 3600000);
    sp.setUTCHours(hora, Math.floor(sorteio() * 60), 0, 0);
    const ocorrido = new Date(sp.getTime() + 3 * 3600000);

    const status: StatusRelato = sorteio() < 0.75 ? 'aprovado' : sorteio() < 0.7 ? 'pendente' : 'rejeitado';
    const descricoes = DESCRICOES[tipo];

    relatos.push({
      id: `00000000-0000-4000-8000-${String(quantidade - i).padStart(12, '0')}`,
      tipo,
      descricao: descricoes[Math.floor(sorteio() * descricoes.length)],
      latitude,
      longitude,
      bairro: lugar.slug,
      ocorrido_em: isoSaoPaulo(ocorrido > agora ? agora : ocorrido),
      status,
      origem: 'mobile',
    });
  }

  return relatos.sort((a, b) => b.ocorrido_em.localeCompare(a.ocorrido_em));
}
