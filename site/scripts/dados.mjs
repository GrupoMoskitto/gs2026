// Copia os dados do modelo de ../ia/data para src/data. Rodar com: npm run dados
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const origem = new URL('../../ia/data/', import.meta.url);
const destino = new URL('../src/data/', import.meta.url);

for (const f of ['previsoes.json', 'resumo_modelo.json']) copyFileSync(new URL(f, origem), new URL(f, destino));

const [, ...linhas] = readFileSync(new URL('lugares.csv', origem), 'utf8').trim().split('\n');
const lugares = linhas.map((l) => {
  const [codigo, nome, tipo, latitude, longitude] = l.split(',');
  return { codigo, nome, tipo, lat: Number(latitude), lng: Number(longitude) };
});
writeFileSync(new URL('lugares.json', destino), JSON.stringify(lugares));
console.log(`${lugares.length} lugares copiados`);
