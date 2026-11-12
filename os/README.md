# os: Operating Systems

**Papel no projeto:** infraestrutura **Windows Server** que hospeda a aplicação web do mapa, é monitorada e responde a falhas.

## Entregas (19/11, 23h55)

- [ ] Repositório com `README.md` (com a Ficha da CitizenTech), roteiro de configuração e evidências (`ipconfig`, `nslookup`, `Test-NetConnection`)
- [ ] Infraestrutura funcional
- [ ] Alertas de CPU, disco e memória no Monitor de Desempenho
- [ ] Teste de falha
- [ ] Vídeo de demonstração de até 7 minutos
- [ ] Um único integrante envia o link

## Avaliação (10 pts)

| Critério | Pontos |
|---|---|
| Rede e identidade (IP fixo, hostname, DNS, domínio no AD) | 2 |
| Aplicação hospedada no IIS (site, pool, dependências, pasta, NTFS) | 2 |
| Monitoramento (CPU, disco, memória) | 2 |
| Tolerância a falhas (recuperação automática do serviço e do pool) e teste de falha | 1 |
| Logs de auditoria (Visualizador de Eventos e logs do IIS) | 1 |
| Funcionamento completo da proposta | 2 |

## Pontos de partida

- VM com Windows Server (VirtualBox, VMware, Hyper-V ou Azure)
- Serviços: DNS, Active Directory, File Server, IIS, GPO, RDS, DFS
- Hospeda a aplicação web do mapa (backend de `soa/` e front-end web)

## Estrutura sugerida

```
os/
├── README.md
├── roteiro/        (passo a passo de configuração)
└── evidencias/     (prints e saídas de comandos)
```

## Status

Não iniciado.

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#6-operating-systems)
