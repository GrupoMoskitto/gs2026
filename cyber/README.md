# cyber: Cybersecurity

**Papel no projeto:** gestão de riscos e proteção do mapa de relatos, que lida com dados sensíveis (localização, relatos de crime).

## Entregas (19/11, 23h55)

- [x] **Relatório de Gestão de Riscos (PDF):** ativos, ameaças, vulnerabilidades, riscos e controles
- [x] **Evidências técnicas** (prints/scripts): *Prepared Statements* contra SQLi, sanitização contra LFI, varredura NMAP, etc.
- [ ] Envio único por equipe no Teams

## Avaliação (10,0)

| Critério | Pontos |
|---|---|
| Mapeamento de ativos e ameaças | 2,5 |
| Análise de vulnerabilidades e riscos | 3,0 |
| Definição de controles | 2,5 |
| Evidências técnicas | 2,0 |

## Pontos de partida

- **Ativos:** banco de relatos, API, servidor, contas de moderador, localização dos relatos
- **Ameaças:** SQL Injection na API, LFI, relatos falsos para difamar ou manipular o mapa, reidentificação de vítimas pela localização, acesso indevido ao painel do moderador, vazamento via OSINT
- **Controles:** consultas parametrizadas, validação de entrada, localização imprecisa, autenticação do moderador, fechamento de portas, logs de auditoria

## Estrutura sugerida

```
cyber/
├── README.md
├── relatorio/      (PDF e fontes)
└── evidencias/     (prints, scripts, saídas de NMAP)
```

## Status

Pronto para a entrega de 19/11.

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#2-cybersecurity)
