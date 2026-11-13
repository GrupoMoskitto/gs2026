# Uso de IA · Mobile

Registro exigido pela GS. Cada linha: data, autor, prompt resumido e o que foi aceito.
O autor precisa saber explicar o código gerado.

| Data | Autor | Prompt (resumo) | O que foi aceito |
|---|---|---|---|
| 12/11/2026 | Gabriel Couto | Regras do app: interface nativa, mobile-first, skills de design, referências, API para rede ruim, logo | `REGRAS.md`, como está. |
| 12/11/2026 | Gabriel Couto | Mockups de paleta, componentes e fundamentos | `mockup/fundamentos.html`, `mockup/componentes.html` e `mockup/tokens.css`. Paleta derivada da cor da logo. |
| 12/11/2026 | Gabriel Couto | Limpar e recolorir a logo | Vetor em três cores e ícone em `assets/brand/`. |
| 12/11/2026 | Gabriel Couto | PDF de proposta de design | `proposta/PROPOSTA-DESIGN.pdf` (17 slides). O calendário do último slide é sugestão. |
| 12/11/2026 | Gabriel Couto | Criar o projeto Expo | Projeto Expo (SDK 58) com abas nativas, serviços com retry, cache e fila offline, telas e testes da camada pura. O projeto `PSS-projeto-sistema-salao` serviu de referência do que roda no Expo Go. |
| 12/11/2026 | Gabriel Couto | Feedback do iOS 26: sem Liquid Glass, informações sobrepostas no mapa, cabeçalho e espaçamento errados | Barra de abas levantada, pontos no lugar dos pinos, título dentro da tela, mais componentes em vidro. |
| 12/11/2026 | Gabriel Couto | Aba de configurações; "Unmatched Route" no login; revisar tudo | Aba Ajustes (tema, conta, envios, privacidade, sobre). Rota raiz com redirecionamento e guardas. Corrigidos: filtros do Relatos sumindo, Ajustes sem fundo, mapa que não seguia o tema. |
| 12/11/2026 | Gabriel Couto | Login mais profissional, com referências do Awesome Design | Tela redesenhada (texto à esquerda, campos limpos, um botão). Só os resumos das páginas das marcas foram lidos. |
| 12/11/2026 | Gabriel Couto | Tirar as bolas de fundo, usar as skills de design e aplicar os achados da revisão | Fundo liso, chips em tinta neutra, cartões de lista opacos. Uma decisão inicial minha, sem consultar a skill, foi refeita. |
| 12/11/2026 | Gabriel Couto | Lista de bairros de APIs públicas | Busca local com lista do IBGE e do OpenStreetMap em `src/data/locais.json`, filtro por tipo em folha, legenda dentro da faixa do topo. |
| 12/11/2026 | Gabriel Couto | Navegação mais limpa (sem spinner ao voltar de aba), busca em Relatos, chip que não cresce, componentes nativos no Novo relato | Recarga silenciosa ao voltar para a aba, busca em Relatos, chip de tamanho fixo. A versão nativa do Novo relato foi recusada (ficou "bugada") e voltou aos chips; ela está guardada fora do repositório para nova tentativa. |
| 12/11/2026 | Gabriel Couto | Corrigir erros do lint do React Compiler | `useRecurso` reescrito com estado derivado, sem ref mutada na renderização. |

## Para conferir antes de entregar

- Rodar o app no Expo Go e validar o que foi gerado (mapa, localização, abas, busca).
- Os valores provisórios (caixa de coordenadas, centros dos bairros) vieram da IA, não de dados oficiais.
