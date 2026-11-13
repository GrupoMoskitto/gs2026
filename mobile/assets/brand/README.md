# Logo do projeto

Marca em pixel art (um inseto visto de cima). Esta é a versão **limpa e vetorial**, refeita da grade de pixels de **63 × 65 células** da imagem original. O PNG original tinha ruído de alpha (pixels quase invisíveis) e pixels soltos. Aqui foram removidos 27 fragmentos de 4 células ou menos (41 pixels). Sobraram 525 pixels em 10 partes: corpo, antena, pontas de asa e pernas. Nada foi desenhado de novo, só se tirou ruído.

## Cores

| Cor | Hex | Uso |
|---|---|---|
| Azul marinho | `#0E3B6B` | Logo em fundo claro. Fundo do ícone do app |
| Azul claro (cor original) | `#B0DCFC` | Logo em fundo escuro ou azul. Inseto do ícone do app |
| Branco | `#FFFFFF` | Logo sobre fotos ou fundos coloridos escuros |

As cores seguem a paleta de marca de [`../../mockup/tokens.css`](../../mockup/tokens.css) (`--brand-700` e `--brand-200`). Se o time trocar a cor da marca, gere os arquivos de novo com a nova cor.

## Arquivos

| Arquivo | O que é | Quando usar |
|---|---|---|
| `logo-mark.svg` | Marca em azul marinho, viewBox `63 × 61` | Fundo claro: telas, documentos, README |
| `logo-mark-light.svg` | Marca em `#B0DCFC` | Fundo escuro ou azul marinho: modo escuro, splash |
| `logo-mark-white.svg` | Marca em branco | Sobre foto ou fundo colorido escuro |
| `logo-mark-512.png` | `logo-mark.svg` em 512 px, fundo transparente | Onde SVG não funciona (apresentações, vídeo) |
| `logo-mark-light-512.png` | `logo-mark-light.svg` em 512 px, fundo transparente | Idem, para fundo escuro |
| `app-icon.svg` | Ícone do app, 1024 × 1024, fundo `#0E3B6B`, inseto `#B0DCFC` com cerca de 62% da largura. **Sem cantos arredondados** (o sistema arredonda) | Fonte do ícone do iOS e da loja |
| `app-icon-1024.png` | `app-icon.svg` em PNG 1024 × 1024 | Campo `icon` do `app.json` (Expo) |
| `app-icon-foreground.svg` | Só o inseto, canvas 108 × 108 dp, tudo dentro do círculo central de 66 dp, fundo transparente | Ícone adaptativo do Android (primeiro plano) |
| `app-icon-background.svg` | Cor lisa `#0E3B6B`, 108 × 108 dp | Ícone adaptativo do Android (fundo) |

Os SVGs usam um único `<path>` por cor, sem imagem embutida, com `shape-rendering="crispEdges"` para manter os pixels nítidos em qualquer tamanho.

## Tamanho mínimo e área de proteção

- **Tamanho mínimo:** 24 pt de altura. Abaixo disso as antenas e as pernas viram ruído. Em 16 a 20 pt, use só o ícone do app.
- **Escala:** a altura útil é de 59 células (61 com a margem de 1 célula do SVG). Então 1 célula equivale a cerca de 1/61 da altura da marca.
- **Área de proteção:** deixar livre ao redor da marca uma margem de pelo menos **1/4 da altura** (cerca de 15 células). Nada de texto, borda ou outro elemento dentro dessa área.

## Usos incorretos

- Não usar o PNG original com ruído. Usar sempre os arquivos desta pasta.
- Não esticar nem achatar a marca, não girar, não inclinar.
- Não suavizar nem aplicar blur: os pixels quadrados fazem parte da identidade.
- Não pôr contorno, sombra, brilho ou degradê na marca.
- Não usar a versão azul marinho em fundo escuro, nem a azul clara em fundo claro (contraste baixo).
- Não colocar a marca sobre fotos movimentadas sem uma camada de cor por baixo.
- Não arredondar os cantos do `app-icon.svg` à mão: iOS e Android aplicam a máscara sozinhos.
