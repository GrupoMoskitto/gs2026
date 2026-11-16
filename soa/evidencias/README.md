# Evidências · API (SOA)

Prints dos testes no Insomnia (coleção em `../insomnia/`). Salve aqui como `NN-nome.png`.

| # | Print | Mostra |
|---|---|---|
| 01 | `01-health.png` | `GET /api/health` → 200 |
| 02 | `02-listar.png` | `GET /api/relatos` → 200 com o cabeçalho `X-Total-Count` |
| 03 | `03-filtros.png` | `GET /api/relatos` com bairro, tipo e status |
| 04 | `04-detalhe.png` | `GET /api/relatos/{id}` → 200 e o 404 |
| 05 | `05-criar.png` | `POST /api/relatos` → 201 (status `pendente`) |
| 06 | `06-idempotencia.png` | mesmo POST com a mesma chave → 200 com o mesmo id |
| 07 | `07-validacao.png` | `POST` inválido → 400 `{ "erro": "..." }` |
| 08 | `08-moderar.png` | `PATCH /api/relatos/{id}/status` → 200 |
| 09 | `09-previsoes.png` | `GET /api/previsoes?bairro=bela_vista` → 4 faixas |
| 10 | `10-migrations.png` | terminal: `dotnet ef migrations list` |
| 11 | `11-banco.png` | tabelas do SQLite (`App_Data/moskitto.db`) num visualizador |
