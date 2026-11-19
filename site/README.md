# Site do Moskitto Radar

Página única que demonstra a solução inteira: o risco de roubo por lugar e horário, o app do cidadão, o caminho do
relato até o mapa, o vídeo da solução (YouTube) e as oito partes da GS, todas prontas.

## Como rodar

```bash
npm install
npm run dev       # abre em http://localhost:5173
npm run build     # gera a pasta dist/, que pode ser servida por qualquer servidor de arquivos
npm run dados     # copia de novo os dados do modelo de ../ia/data
npm run video     # baixa os vídeos (rode uma vez)
```

Os vídeos ficam fora do git, como anexos do release [`midia`](https://github.com/GrupoMoskitto/gs2026/releases/tag/midia):
o do app (`public/app/apresentacao.mp4`) e os das partes (`public/videos/ia.mp4`, `soa.mp4`, `csharp.mp4`, `iot.mp4`, `os.mp4`,
abertos pelo botão "Ver vídeo" de cada cartão em [`Partes.tsx`](src/secoes/Partes.tsx)). As capas (`.webp`) ficam no git.
Para trocar um vídeo, substitua o anexo no release.

## Publicação

O site vai para o GitHub Pages pela Action [`.github/workflows/site.yml`](../.github/workflows/site.yml). Ela roda a
cada push na `main` que mexa em `site/` ou nos dados do modelo (`ia/data`), e também à mão, na aba Actions. A Action
copia os dados do modelo, baixa os vídeos, checa os tipos, gera `dist/` e publica.

O site roda na raiz de um domínio próprio (`base: '/'` no `vite.config.ts`).

## O que tem

| Seção | O que mostra |
|---|---|
| Capa | O título, os números do modelo e uma simulação do app que dá para tocar e que se mexe sozinha enquanto ninguém mexe |
| O risco de cada lugar | Mapa dos 129 lugares, busca e faixa do dia, com a previsão do modelo |
| O app do cidadão | Fileira de cartões com nove loops gravados do app (`public/app/loops/`) |
| O modelo de risco | Fileira de cartões: roubos por hora, pico e calmaria, o que levam, F1 e cobertura |
| Do relato ao mapa | Seis etapas, cada uma com o seu exemplo: o JSON do relato, a câmera ao vivo, a API, a moderação, o modelo e o mapa |
| As oito partes | Um cartão por matéria, com o dono, a situação e o que entrega |
| Quem faz | A equipe |

O visual segue o tema do app (`../mobile/mockup/tokens.css`): fundo claro, superfícies brancas, cantos bem redondos,
pílulas e os tons suaves de risco. Há também um tema escuro, que segue o sistema e pode ser trocado no topo.

## Dados

Tudo vem de `../ia/data`, copiado para `src/data/` com `npm run dados`: as previsões (`previsoes.json`), o resumo do
modelo (`resumo_modelo.json`) e os 129 lugares (`lugares.csv`). O risco usa as contagens públicas de roubos da SSP-SP.
Os relatos que aparecem nas telas do app são simulados. Não há dado pessoal real.

As imagens e os loops em `public/app/` saem das gravações do app no emulador Android, as mesmas do vídeo do app.

## Bibliotecas

React 19, Vite e TypeScript estrito. Tailwind CSS para o estilo, Radix UI (diálogo, popover e grupo de
botões), cmdk (busca de lugar), Motion (animações), Recharts (gráfico por hora), React Leaflet com OpenStreetMap
(mapa), Lucide (ícones) e a fonte Roboto.

## Para atualizar uma parte

A lista das partes fica em `src/secoes/Partes.tsx`. Quando uma parte ficar pronta, troque `pronta` para `true` e
escreva em `evidencias` onde elas estão.
