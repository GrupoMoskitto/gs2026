# mobile: Mobile Development & IOT

**Papel no projeto:** o app do cidadão, em **React Native + Expo + TypeScript**. É a porta de entrada: ver o mapa, listar e detalhar relatos e registrar novos.

## Entregas (19/11, 23h55)

- [ ] App em React Native + Expo (Expo Go), **TypeScript estrito**
- [ ] ZIP da pasta do app **sem `node_modules`**
- [ ] `README.md` (Ficha da CitizenTech e como rodar)
- [ ] `DECISOES.md` (1 a 2 páginas)
- [ ] Array `authors` no `package.json` (nome e RM de todos)
- [ ] Vídeo demo de até 2 minutos

## Avaliação

| Critério | Peso |
|---|---|
| Funcionalidade: 3+ telas com navegação, lista com carregando/erro/vazio, formulário validado que cria item, identificação lembrada ao reabrir | 40% |
| Qualidade TypeScript: modo estrito, sem `any`, `tsc --noEmit` limpo | 30% |
| Recurso nativo com permissão tratada | 20% |
| Organização e documentação: camada `services/`, validação pura, README e DECISOES | 10% |

**Portas de entrada:** `tsc` sem erro e sem `any`, app nativo (WebView não é aceito), identificação completa.

## Pontos de partida

- Telas: identificação, mapa, lista de relatos, detalhe, novo relato
- Recurso nativo: **localização** (posição do relato e aviso de zona de risco)
- Consome a API do `soa/`

## Estrutura sugerida

```
mobile/
├── README.md
└── (projeto Expo a criar)
```

## Status

Não iniciado.

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#5-mobile-development--iot)
