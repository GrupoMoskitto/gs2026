# soa: Arquitetura Orientada a Serviços e Web Services

**Papel no projeto:** backend do mapa de relatos. API REST e banco de dados que guardam e servem os relatos para todos os outros clientes (mobile, web, desktop, IoT).

## Entregas (19/11, 23h55)

- [ ] Repositório com o código completo
- [ ] README com instruções de execução, descrição da solução e nomes dos integrantes
- [ ] Evidências da aplicação
- [ ] Envio do link do GitHub

## Avaliação (10,0)

| Critério | Pontos |
|---|---|
| Estruturação do domínio | 3,0 |
| Conexão com banco de dados | 3,0 |
| Migrações | 2,5 |
| Testes manuais (Insomnia) | 1,5 |

## Esboço

- Entidades: Relato, Usuário, Moderação (ver specs no [README raiz](../README.md))
- Endpoints (sugestão): criar relato, listar com filtros, detalhe, moderar, previsão de risco
- Coleção do Insomnia versionada aqui

## Estrutura sugerida

```
soa/
├── README.md
└── (código, migrações e coleção do Insomnia a criar)
```

## Status

Não iniciado.

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#1-arquitetura-orientada-a-serviços-soa-e-web-services)
