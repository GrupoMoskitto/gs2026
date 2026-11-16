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

Ao subir, a API aplica as migrations sozinha, cria o banco em `App_Data/moskitto.db` e, se ele estiver vazio,
carrega os dados iniciais (ver abaixo). Para começar do zero, apague a pasta `App_Data/`.
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

## Rotas

O JSON segue o formato comum do projeto (`AGENTS.md`, seção 4): chaves em snake_case e valores pelo código
(`bolsa_mochila`, `pendente`). Todo erro volta como `{ "erro": "mensagem" }`.

| Método | Rota | Resposta |
|---|---|---|
| GET | `/api/health` | `200 { "status": "ok", "banco": "ok", ... }`, ou `503` se o banco falhar |
| GET | `/api/relatos?bairro=&tipo=&status=&limite=` | array dos mais recentes, até 200 (máx. 1000 com `limite`); total no cabeçalho `X-Total-Count`; `400` se um filtro for inválido |
| GET | `/api/relatos/{id}` | o relato, ou `404` |
| POST | `/api/relatos` | `201` com o relato criado (sempre `pendente`) e cabeçalho `Location`; `400` se inválido; `200` com o relato já existente se a `Idempotency-Key` repetir |
| GET | `/api/previsoes?bairro=` | array das previsões (516 sem filtro, 4 com `bairro`); `400` se o lugar não existir |

### Validação do POST

| Campo | Regra |
|---|---|
| `tipo` | obrigatório: `celular`, `bolsa_mochila`, `veiculo`, `bicicleta`, `comercio` ou `outro` |
| `descricao` | opcional, até 280 caracteres (espaços nas pontas são removidos) |
| `latitude`, `longitude` | obrigatórias, dentro da caixa da região; gravadas com 3 casas decimais |
| `bairro` | obrigatório, um dos 129 códigos da tabela `lugares` |
| `ocorrido_em` | obrigatório, com fuso (`2026-11-10T21:35:00-03:00`), nos últimos 30 dias e não no futuro (5 min de folga) |
| `origem` | obrigatória: `mobile`, `desktop` ou `iot` |
| `id`, `status` | ignorados se vierem: a API gera o id e todo relato novo é `pendente` |

Todos os problemas voltam juntos numa mensagem só, ex.: `{ "erro": "tipo é obrigatório. bairro é obrigatório." }`.

**Caixa de coordenadas (provisória):** latitude de -24.1 a -23.15 e longitude de -47.1 a -45.75, a mesma do app
(`mobile/src/config/regiao.ts`). Fica em `appsettings.json`, seção `Regiao`, e ainda é decisão em aberto do time
(`AGENTS.md`, seção 7, item 5).

**Relato duplicado:** o app manda o cabeçalho `Idempotency-Key` em cada relato (inclusive os que ficaram na fila
sem internet). Se a mesma chave chegar de novo, a API não cria outro: devolve `200` com o relato original e o
cabeçalho `Idempotent-Replayed: true`. O índice único no banco garante isso mesmo com envios simultâneos.

Exemplos prontos em `MoskittoRadar.Api/MoskittoRadar.Api.http`.

## Dados iniciais

Na primeira execução, `Data/CargaInicial.cs` carrega os arquivos da pasta `MoskittoRadar.Api/Dados/`:

| Arquivo | Linhas | Tabela |
|---|---|---|
| `lugares.csv` | 129 | `lugares` |
| `relatos_simulados.csv` | 10.000 (7.494 aprovados, 1.810 pendentes, 696 rejeitados) | `relatos` |
| `previsoes.json` | 516 (129 lugares × 4 faixas) | `previsoes` |

- São **cópias** de `ia/data/` (Coto). Ficam dentro da API para irem junto no publish para o IIS.
- Os relatos são **simulados** (`ia/scripts/gerar_relatos.py`, seed 42), sem nenhum dado pessoal.
  As previsões vêm do modelo treinado com os dados públicos da SSP-SP.
- Cada tabela só é carregada se estiver vazia: reiniciar a API não duplica nada.
- Se o Coto atualizar os dados, copie de novo e apague `App_Data/`:

```bash
cp ../ia/data/lugares.csv ../ia/data/relatos_simulados.csv ../ia/data/previsoes.json MoskittoRadar.Api/Dados/
```

## Status

- [x] Domínio, banco e migrations
- [x] Carga do CSV simulado e das previsões
- [x] Rotas de consulta (health, relatos, previsões)
- [x] Rota de criação (POST) com validação e idempotência
- [ ] Rota de moderação (PATCH)
- [ ] Testes no Insomnia
- [ ] Publicação para o IIS

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#1-arquitetura-orientada-a-serviços-soa-e-web-services)
