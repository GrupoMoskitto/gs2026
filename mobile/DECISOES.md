# Decisões de projeto · Mobile

Documento exigido pela GS (1 a 2 páginas).

## O que o app faz

O cidadão se identifica com apelido e RM, vê os relatos e o risco da Região Metropolitana de São Paulo e registra um relato novo (tipo, local, horário e descrição curta). Não há dado pessoal: o local é aproximado (3 casas decimais, cerca
de 100 m) e a descrição é opcional.

## Decisões e motivos

| Decisão | Por quê |
|---|---|
| **Expo Router com abas nativas** (`NativeTabs`) | A barra de abas é a do sistema: vidro no iOS 26 e Material no Android, sem desenhar à mão. É o que a regra 1 do `REGRAS.md` pede. |
| **Liquid Glass só quando existe** (`isLiquidGlassAvailable` e `isGlassEffectAPIAvailable`) | iOS antigo, Android e "Reduzir transparência" caem num fundo sólido. O app nunca depende do efeito. |
| **Redirecionamentos explícitos em vez de `Stack.Protected`** | Sem uma rota `/`, o login mostrava "Unmatched Route": ao trocar a guarda o roteador não achava âncora. Agora `index.tsx` decide o destino, e a identificação e as abas redirecionam conforme haja sessão. |
| **Tema escolhido nos Ajustes via `Appearance.setColorScheme`** | Troca o esquema do app inteiro, inclusive componentes nativos (abas, cabeçalho, vidro). O mapa recebe `userInterfaceStyle` e, no Android, um estilo escuro. |
| **Título dentro da tela, sem cabeçalho grande nativo** (Mapa, Relatos, Risco, Ajustes) | No iOS 26 o cabeçalho é translúcido, deixava um vazio grande no topo e escondia o conteúdo. O Detalhe mantém o cabeçalho nativo com o botão Voltar. |
| **Região metropolitana de São Paulo, por distrito na capital e município nas outras cidades** | Decisão do Coto (12/11/2026). O campo `bairro` do relato passa a guardar o código do lugar (`dis_355030801`, `mun_3518800`); `bela_vista`, `cerqueira_cesar` e `consolacao` seguem válidos. Lista em `src/config/locais.ts`. O nome do campo foi mantido para não quebrar a API. |
| **Busca de lugar local, com lista pública guardada no repositório** | Nomes do IBGE e pontos do OpenStreetMap, consultados uma vez por `scripts/gerar-locais.mjs`. Nada digitado pela pessoa sai do aparelho, funciona offline e não depende de geocodificador. 6 distritos ficaram de fora por falta de ponto confiável. |
| **Busca só move o mapa; o filtro é separado** | Buscar é ir a um lugar. Filtrar é escolher o que aparece (tipo e bairro, em folha de baixo). O filtro conta os relatos do resultado e some o cartão aberto se o relato sair do mapa. |
| **Legenda de risco dentro da faixa do topo** | Libera o canto inferior esquerdo para a atribuição do Apple Maps, que não pode ser removida. |
| **Chip selecionado em tinta neutra; cartões de lista opacos** | Segue a skill de design: azul só nos dados e na ação principal; vidro só no que flutua sobre o mapa. |
| **Tema em um só lugar** (`src/theme/`) | Valores copiados de `mockup/tokens.css`, com claro e escuro. Risco e status sempre têm texto e ícone, nunca só cor. |
| **Camada `services/` separada da interface** | A tela só pede dados e recebe `{ dados, fonte }`. Trocar a API não mexe nas telas. |
| **Rede ruim como caso normal** | Tempo limite, cancelamento, nova tentativa com espera crescente e variação aleatória, cache e fila offline. |
| **`POST` só repete com `Idempotency-Key`** | Repetir um envio sem a chave poderia duplicar o relato. A chave precisa ser aceita pela API (ver "Combinar com o João"). |
| **Dados de exemplo como último recurso** | O app abre e demonstra tudo mesmo sem API, e **avisa na tela** que são exemplos. O enunciado pede o mock. |
| **Aba Risco com o resumo do modelo** (`src/data/resumo_modelo.json`, gerado por `ia/scripts/exportar_app.py`) | A API só manda nível e nota. Roubos por dia, hora do dia, o que levam, previsão do mês e acerto do modelo vêm de um resumo de 19 KB da `ia/`, sem dado pessoal. Os gráficos são `View` simples, sem biblioteca nova, com rótulo e número escritos ao lado da cor. |
| **Previsão do modelo guardada no app** (`src/data/previsoes.json`, `services/modelo.ts`) | Sem API, o risco não é inventado: é a saída do modelo de ML da `ia/`, treinado com os roubos da SSP-SP. A faixa diz "Previsão do modelo". Um teste confere que a cópia é igual à da `ia/` e que cobre os 129 lugares nas 4 faixas. |
| **Validação em funções puras** (`src/utils/validacao.ts`) | Dá para testar no Node, sem celular. As mesmas regras valem na API; a do app só avisa cedo. |
| **Sem biblioteca de estado nem de requisições** | O app é pequeno. Um hook próprio (`useRecurso`) cobre carregando, erro, pronto e recarregando e é fácil de explicar. |
| **`react-native-maps`** no mapa | A documentação do Expo diz que funciona no Expo Go sem configuração. É a base da tela de mapa (proposta). |
| **Quando aconteceu por opções rápidas** (agora, 1 h, 3 h, ontem) | Evita um seletor de data com mais uma dependência e atende ao caso real: relatar logo depois do fato. |
| **TypeScript estrito, sem `any`** | Os dados da API entram como `unknown` e passam por funções de conferência (`src/services/tipos.ts`) antes de serem usados. |

## Referências consultadas

Regra 4 do `REGRAS.md`: repositório **awesome-design-md**. Foram lidos os padrões de **Apple** e **Uber**; do
**Airbnb** só a descrição geral. Os arquivos descrevem sites, então servem de referência de cor e tom, não de
componente nativo. *A conferir pelo autor: escrever aqui o que de fato foi adotado de cada marca.*
Também foi usado, como exemplo de projeto que roda no Expo Go com o mesmo conjunto de pacotes, o projeto
`PSS-projeto-sistema-salao` (implementação própria de abas nativas e vidro, adaptada aqui).

## Mudança de região: o que o time precisa combinar

O app já trabalha com a região metropolitana de São Paulo, mas o `AGENTS.md` (seção 4) ainda descreve só a Av. Paulista e 3 bairros.

- **João (API):** `bairro` deixa de ser um de 3 valores e aceita os códigos de `src/data/locais.json` (ids `dis-…` e `mun-…`, com `-` virando `_`).
  A validação de coordenadas passa a usar a caixa da região metropolitana (latitude -24,1 a -23,15; longitude -47,1 a -45,75, provisória).
  Enquanto a API aceitar só os 3 códigos antigos, um relato de outro lugar volta com erro 400.
- **Coto (IA):** o gerador do CSV e o modelo passam a ter um lugar por linha (cerca de 125 lugares no lugar de 3 bairros).
- **Kato e Marcelo:** o ponto do botão de pânico e o texto do público-alvo precisam apontar para a região nova.
- **Dados do app:** os relatos de exemplo são simulados para a região toda, com mais ocorrências no centro expandido. O
  risco vem do modelo de ML (`ia/data/previsoes.json`), com os mesmos 129 códigos de lugar.

## Combinar com o João (API)

A seção 5 do `REGRAS.md` propõe mudanças no servidor. O app já funciona sem elas, mas melhora com:

- aceitar o cabeçalho `Idempotency-Key` no `POST /api/relatos`;
- paginação (`limit` e `cursor`) e `ETag` nas listas;
- respostas comprimidas;
- erros sempre como `{ "erro": "..." }`.

## Pendências e limites conhecidos

- **Testado no Expo Go** em iPhone (iOS 26) e no emulador Android (Pixel 8): mapa, abas, busca, formulário e
  identificação lembrada ao reabrir. Prints do Android em `prints/`.
- **Caixa de coordenadas provisória** (`src/config/regiao.ts`). A decisão 5 do `AGENTS.md` está em aberto;
  API, C# e app precisam usar os mesmos limites.
- **Mapa é proposta** (decisão 2 do `AGENTS.md`). Se o time não aprovar, a aba sai sem afetar o resto.
- **Moderação** (decisão 1): o app mostra o status de cada relato. Quem aprova ainda depende de como o C# vai
  falar com a API.
- **Pinos do mapa coloridos pelo risco do lugar** no horário de agora, com a granularidade que o ML adotou
  (distrito na capital, município fora dela).
- Sem testes de interface automatizados: só a camada pura e a previsão guardada (40 testes).
