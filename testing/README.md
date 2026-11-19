# Testing, Compliance & Quality Assurance

**Moskitto Radar**: mapa de relatos de roubo da Grande São Paulo. Arquitetura de soluções (TOGAF e ArchiMate) que
justifica a solução inteira, documento descritivo e o pitch da GS. Global Solution FIAP 2026.2, CitizenTech,
Engenharia de Software (3º ano).

Site da solução: https://gs2026.cotoo.dev · Pitch: https://youtu.be/Z_ufQk3Rwaw

## Equipe

| Nome | RM |
|---|---|
| Gabriel Couto | RM559579 |
| Gabriel Kato | RM560000 |
| João Vitor de Matos | RM559246 |
| Marcelo Affonso | RM559790 |

## O que tem aqui

| Pasta | Conteúdo |
|---|---|
| [`arquitetura/`](arquitetura/) | Diagrama ArchiMate (`moskitto-radar.archimate`, abre no [Archi](https://www.archimatetool.com)) e as imagens da visão geral e de cada camada: Motivação, Negócios, Sistemas (Aplicação) e Infraestrutura (Tecnologia) |
| [`documento/`](documento/) | Documento descritivo (`Documento-descritivo-Moskitto-Radar.pdf`): projeto, equipe e desafio, público-alvo e impacto com fontes, e as 4 visões. |
| [`pitch/`](pitch/) | Link do vídeo do pitch no YouTube (até 4 minutos) |

## Onde cada critério está

| Critério | Peso | Onde |
|---|---|---|
| Visão da Arquitetura (Motivação) | 20% | documento, seção 3 · `arquitetura/imagens/1-motivacao.png` |
| Visão de Negócios | 20% | documento, seção 4 · `arquitetura/imagens/2-negocios.png` |
| Visão de Sistemas (Aplicação) | 20% | documento, seção 5 · `arquitetura/imagens/3-sistemas.png` |
| Visão de Infraestrutura (Tecnologia) | 20% | documento, seção 6 · `arquitetura/imagens/4-infraestrutura.png` |
| Nome do projeto, equipe (nome e RM) e desafio | 10% | capa e seção 1 do documento |
| Público-alvo e impacto, com dados e fontes | 10% | seções 2, 3 (Tabela 1) e 8 do documento |

O diagrama mostra a **arquitetura-alvo**. Duas setas ainda não existem no protótipo, e o documento diz isso: o HTTPS
no IIS (hoje a API responde em HTTP) e o retreino do modelo com os relatos aprovados (hoje ele usa só os dados da
SSP-SP).

## Como abrir

- **Diagrama:** abra `arquitetura/moskitto-radar.archimate` no Archi.
- **Documento:** `documento/Documento-descritivo-Moskitto-Radar.pdf`.

## Status

Pronto para a entrega de 19/11.
