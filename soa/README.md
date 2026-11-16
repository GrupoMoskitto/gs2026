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

- Entidades: Relato, Lugar, Moderação, PrevisaoRisco (pasta `MoskittoRadar.Api/Models/`)
- Endpoints (sugestão): criar relato, listar com filtros, detalhe, moderar, previsão de risco
- Coleção do Insomnia versionada aqui

## Estrutura sugerida

```
soa/
├── README.md
└── (código, migrações e coleção do Insomnia a criar)
```

## Como rodar

```bash
cd soa/MoskittoRadar.Api
dotnet run
```

Ao subir, a API aplica as migrations sozinha e cria o banco em `App_Data/moskitto.db`.
Para criar uma migration nova: `dotnet ef migrations add <Nome>`.

## Banco de dados

SQLite com Entity Framework Core 10. As tabelas são criadas pela migration `Inicial`:

| Tabela | O que guarda |
|---|---|
| `lugares` | os 129 lugares (`ia/data/lugares.csv`); `relatos.Bairro` e `previsoes.Bairro` apontam para cá |
| `relatos` | os relatos, com índice único na chave de idempotência (evita relato duplicado) |
| `moderacoes` | histórico de cada mudança de status |
| `previsoes` | a previsão do ML, uma por lugar e faixa horária |

- Os enums são gravados com o mesmo código do JSON (`bolsa_mochila`, `pendente`...).
- As datas são gravadas como número (UTC + fuso), porque o SQLite não ordena `DateTimeOffset`
  guardado como texto. Ver `Data/Conversores.cs`.

## Status

- [x] Domínio, banco e migrations
- [ ] Carga do CSV simulado e das previsões
- [ ] Rotas da API
- [ ] Testes no Insomnia
- [ ] Publicação para o IIS

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#1-arquitetura-orientada-a-serviços-soa-e-web-services)
