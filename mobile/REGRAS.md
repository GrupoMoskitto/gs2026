# Regras do app mobile e da API

Valem para todo código e todo design do `mobile/` e para a parte da API que o app consome.
O `AGENTS.md` da raiz aponta para este arquivo. Em caso de conflito, o `AGENTS.md` vence.

## 1. Interface nativa em cada plataforma

No **iOS**, seguir o design do sistema com **Liquid Glass** (iOS 26 ou mais novo). No **Android**, seguir o
**Material 3** nativo.

- Usar os componentes do sistema (abas, barras, folhas, controles, ícones SF Symbols no iOS e Material Symbols
  no Android) em vez de redesenhar à mão.
- Quando iOS e Android divergirem, separar por plataforma (`Platform.select` ou arquivos `.ios.tsx` e
  `.android.tsx`).
- O que fica igual nas duas: cor da marca, logo, textos e tom.
- Cada efeito nativo precisa de **plano B** para versões antigas (iOS anterior ao 26, Android sem cor
  dinâmica): checar a disponibilidade antes de usar.
- A GS exige **Expo Go**. Antes de adotar um módulo nativo, **testar no Expo Go de verdade**. Se só funcionar
  em development build, não usar (ou deixar atrás de um plano B).

## 2. Mobile-first, pensado como aplicativo

Nunca um site adaptado.

- Navegação por abas e pilha, gestos, áreas seguras (*safe areas*), teclado, retrato primeiro.
- Alvos de toque de pelo menos **44 pt (iOS)** e **48 dp (Android)**.
- Sem *hover*, sem layout de desktop, sem rolagem horizontal da tela.
- Listas virtualizadas, *pull to refresh*, retorno tátil (háptico) nas ações importantes.
- Projetar primeiro para 360 a 430 pt de largura.

## 3. Skills e plugins de design

Antes de criar ou mudar telas e componentes, usar as skills de design que o harness tiver (por exemplo,
`taste-skill` e `frontend-design`).

- Elas são pensadas para web: aproveitar os princípios (hierarquia, restrição, nada de visual genérico).
  No que for padrão nativo (vidro do iOS, componentes do Material), **a convenção da plataforma vence**.
- Valores de design ficam em um só lugar (`mobile/src/theme/`): cor, tipografia, espaçamento, raios e
  movimento, com **modo claro e escuro**.
- Ponto de partida: [`mockup/tokens.css`](mockup/tokens.css).

## 4. Referências de apps conhecidos

Consultar o repositório **awesome-design-md** (<https://github.com/VoltAgent/awesome-design-md>, com
`DESIGN.md` de marcas conhecidas, como Apple, Uber, Airbnb, Revolut, Wise e Spotify) antes de decidir um
padrão de tela.

- Os arquivos são de **sites**: servem de referência de cor, tipografia e tom, não de componente nativo.
- Cada arquivo é baixado por marca (`npx getdesign@latest add <marca>`) ou pela página da marca em
  `getdesign.md`. Conferir o que o comando faz antes de rodar.
- Registrar no `DECISOES.md` o que foi consultado e o que foi adotado.

## 5. API pensada para celular

Conexão ruim, latência alta e app que vai para segundo plano são o caso normal.

**Cliente** (`mobile/src/services/`):

- Tempo limite em toda chamada e cancelamento (`AbortController`).
- **Retry com backoff exponencial e jitter**, só em chamadas seguras de repetir (GET e PATCH). POST só com
  chave de idempotência.
- Cache da última resposta.
- Estados de **carregando, erro, vazio e sem conexão**.
- Relato criado sem conexão vai para uma **fila** e é enviado depois.

**Servidor** (**proposta, combinar com o João**, porque muda o contrato da seção 4 do `AGENTS.md`):

- Respostas pequenas e comprimidas (gzip ou brotli).
- Paginação (`limit` e `cursor`) nas listas.
- `ETag` com `If-None-Match`.
- Chave `Idempotency-Key` no `POST /api/relatos`.
- Erros sempre no formato `{ "erro": "..." }`.

Testar com rede lenta simulada e com a API fora do ar.

## 6. Logo do projeto

Usar a logo de [`assets/brand/`](assets/brand/), nas versões limpas (vetor) para fundo claro e escuro. Não usar
o PNG original. A cor da logo segue a paleta de marca (`mockup/tokens.css`) e pode mudar se o time decidir.
