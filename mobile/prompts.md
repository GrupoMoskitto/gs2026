# Uso de IA · Mobile

Registro exigido pela GS: data, autor, prompt resumido e o que foi aceito. O autor sabe explicar o código gerado.

| Data | Autor | Prompt (resumo) | O que foi aceito |
|---|---|---|---|
| 12/11/2026 | Gabriel Couto | Regras do app: interface nativa, mobile-first, design, API para rede ruim e logo | `REGRAS.md`, sem mudanças. |
| 12/11/2026 | Gabriel Couto | Mockups de paleta, componentes e fundamentos | `mockup/fundamentos.html`, `mockup/componentes.html` e `mockup/tokens.css`, com a paleta tirada da cor da logo. |
| 12/11/2026 | Gabriel Couto | Limpar e recolorir a logo | Logo em vetor, em três cores, e ícone do app em `assets/brand/`. |
| 12/11/2026 | Gabriel Couto | PDF da proposta de design | `proposta/PROPOSTA-DESIGN.pdf`, com 17 slides. O calendário do último slide é só sugestão. |
| 12/11/2026 | Gabriel Couto | Criar o projeto Expo | Projeto Expo (SDK 58) com abas nativas, serviços com nova tentativa, cache e fila offline, telas e testes da lógica pura. |
| 12/11/2026 | Gabriel Couto | Ajustes para o iOS 26: Liquid Glass, mapa, cabeçalho e espaçamento | Barra de abas mais alta, pontos no lugar dos pinos, título dentro da tela e mais componentes em vidro. |
| 12/11/2026 | Gabriel Couto | Aba de ajustes, erro "Unmatched Route" no login e revisão geral | Aba Ajustes (tema, conta, envios, privacidade, sobre), rota inicial com redirecionamento e correções nos filtros, no fundo e no tema do mapa. |
| 12/11/2026 | Gabriel Couto | Login mais profissional | Tela redesenhada: texto à esquerda, campos limpos e um botão só. |
| 12/11/2026 | Gabriel Couto | Fundo liso e ajustes da revisão de design | Fundo sem enfeites, chips neutros e cartões opacos na lista. |
| 12/11/2026 | Gabriel Couto | Lista de bairros a partir de fontes públicas | Busca local com a lista do IBGE e do OpenStreetMap em `src/data/locais.json`, filtro por tipo e legenda no topo. |
| 12/11/2026 | Gabriel Couto | Navegação mais limpa, busca em Relatos e componentes nativos no Novo relato | Recarga silenciosa ao trocar de aba, busca em Relatos e chip de tamanho fixo. A versão nativa do Novo relato foi recusada por bugs e o formulário voltou aos chips. |
| 12/11/2026 | Gabriel Couto | Corrigir os avisos do React Compiler | `useRecurso` reescrito com estado derivado. |

## Para conferir antes de entregar

- Testar no Expo Go o mapa, a localização, as abas e a busca.
- A caixa de coordenadas e os centros dos bairros vieram da IA, não de dados oficiais.
