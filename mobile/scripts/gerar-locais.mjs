// Gera src/data/locais.json com os lugares do IBGE; o centro dos distritos vem do Nominatim (1 pedido por segundo).
import { writeFile, mkdir } from 'node:fs/promises';

const IBGE = 'https://servicodados.ibge.gov.br/api';
const CAPITAL = 3550308;
const AGENTE = 'mapa-de-relatos-gs-fiap/0.1 (projeto academico)';

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const arredondar3 = (n) => Math.round(n * 1000) / 1000;

async function json(url, opcoes) {
  const r = await fetch(url, opcoes);
  if (!r.ok) throw new Error(`${r.status} em ${url}`);
  return r.json();
}

function centroide(geometria) {
  const aneis = geometria.type === 'Polygon' ? [geometria.coordinates[0]] : geometria.coordinates.map((p) => p[0]);
  let melhor = null;
  for (const anel of aneis) {
    let area = 0, cx = 0, cy = 0;
    for (let i = 0; i < anel.length - 1; i++) {
      const [x0, y0] = anel[i];
      const [x1, y1] = anel[i + 1];
      const f = x0 * y1 - x1 * y0;
      area += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }
    area /= 2;
    if (area === 0) continue;
    if (!melhor || Math.abs(area) > Math.abs(melhor.area)) melhor = { area, longitude: cx / (6 * area), latitude: cy / (6 * area) };
  }
  return melhor;
}

function caixa(geometria) {
  const pontos = (geometria.type === 'Polygon' ? geometria.coordinates : geometria.coordinates.flat()).flat();
  const lngs = pontos.map((p) => p[0]);
  const lats = pontos.map((p) => p[1]);
  return { lngMin: Math.min(...lngs), lngMax: Math.max(...lngs), latMin: Math.min(...lats), latMax: Math.max(...lats) };
}

const rm = (await json(`${IBGE}/v1/localidades/regioes-metropolitanas/04901`))[0];
// A capital aparece em todas as sub-regiões da lista do IBGE: deduplica pelo código.
const municipiosRM = [...new Map(rm['sub-regioes-metropolitanas'].flatMap((s) => s.municipios).map((m) => [m.id, m])).values()];
const malha = await json(`${IBGE}/v3/malhas/estados/35?intrarregiao=municipio&formato=application/vnd.geo+json&qualidade=minima`);
const porCodigo = new Map(malha.features.map((f) => [String(f.properties.codarea), f.geometry]));

const locais = [];
let caixaCapital = null;
for (const m of municipiosRM) {
  const geo = porCodigo.get(String(m.id));
  const c = geo ? centroide(geo) : null;
  if (!c) {
    console.warn(`Sem malha para ${m.nome}; ficou de fora.`);
    continue;
  }
  if (m.id === CAPITAL) caixaCapital = caixa(geo);
  locais.push({ id: `mun-${m.id}`, nome: m.nome, tipo: 'municipio', latitude: arredondar3(c.latitude), longitude: arredondar3(c.longitude) });
}
if (!caixaCapital) throw new Error('Não achei a malha da capital.');

const distritos = await json(`${IBGE}/v1/localidades/municipios/${CAPITAL}/distritos`);
const falhas = [];
for (const d of distritos) {
  await pausa(1100);
  const q = encodeURIComponent(`${d.nome}, São Paulo, SP, Brasil`);
  const achados = await json(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&countrycodes=br`, {
    headers: { 'User-Agent': AGENTE },
  });
  const a = achados[0];
  const lat = a ? Number(a.lat) : NaN;
  const lng = a ? Number(a.lon) : NaN;
  const dentro = lat >= caixaCapital.latMin && lat <= caixaCapital.latMax && lng >= caixaCapital.lngMin && lng <= caixaCapital.lngMax;
  if (!a || !dentro) {
    falhas.push(d.nome);
    continue;
  }
  locais.push({ id: `dis-${d.id}`, nome: d.nome, tipo: 'distrito', latitude: arredondar3(lat), longitude: arredondar3(lng) });
}

// O centro geométrico da capital cai no extremo sul (zona rural); para o mapa vale mais o centro, o distrito Sé.
const se = locais.find((l) => l.tipo === 'distrito' && l.nome === 'Sé');
const capital = locais.find((l) => l.id === `mun-${CAPITAL}`);
if (se && capital) Object.assign(capital, { latitude: se.latitude, longitude: se.longitude });

locais.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
await mkdir(new URL('../src/data/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/data/locais.json', import.meta.url), JSON.stringify(locais, null, 1) + '\n');

const n = (t) => locais.filter((l) => l.tipo === t).length;
console.log(`${n('municipio')} municípios e ${n('distrito')} distritos gravados.`);
if (falhas.length) console.log(`Distritos sem ponto confiável (ficaram de fora): ${falhas.join(', ')}`);
