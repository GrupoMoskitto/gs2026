# Moskitto Radar · API (SOA)

API REST do Moskitto Radar, a CitizenTech da equipe na GS FIAP 2026.2. Guarda os relatos de roubo da Região
Metropolitana de São Paulo e serve a previsão de risco do modelo de ML. É usada pelo app mobile, pelo botão de
pânico (ESP32) e pela moderação, e roda no IIS do Windows Server.

**Stack:** ASP.NET Core Web API (.NET 10), Entity Framework Core 10, SQLite.

## Integrantes

| Nome | RM |
|---|---|
| João Vitor de Matos | RM559246 |
| Gabriel Couto | RM559579 |
| Gabriel Kato | RM560000 |
| Marcelo Affonso | RM559790 |

## Estrutura

```
soa/
├── MoskittoRadar.Api/
│   ├── Controllers/   rotas (relatos, previsões, health)
│   ├── Models/        domínio: Relato, Lugar, Moderacao, PrevisaoRisco, enums
│   ├── Data/          AppDbContext, conversores e carga inicial
│   ├── Migrations/    migrations do EF Core
│   └── Dados/         CSV e JSON do Coto (carga inicial)
├── publicar.ps1       gera o pacote para o IIS
├── insomnia/          coleção do Insomnia (25 requisições)
└── evidencias/        prints dos testes
```

## Como rodar

```bash
cd soa/MoskittoRadar.Api
dotnet run
```

Ao subir, a API aplica as migrations sozinha, cria o banco em `App_Data/moskitto.db` e, se ele estiver vazio,
carrega os dados iniciais (ver abaixo). Para começar do zero, apague a pasta `App_Data/`.
Para criar uma migration nova: `dotnet ef migrations add <Nome>`.

## Acesso pelo celular (app do Coto)

1. Suba a API ouvindo na rede local:

   ```bash
   dotnet run --launch-profile celular
   ```

2. Descubra o IP do computador no **Wi-Fi** com `ipconfig` (ex.: `192.168.0.10`; não use o do VirtualBox, `192.168.56.x`).
3. Libere a porta 5207 no firewall do Windows (uma vez, no PowerShell como administrador):

   ```powershell
   New-NetFirewallRule -DisplayName "Moskitto API 5207" -Direction Inbound -Protocol TCP -LocalPort 5207 -Action Allow -Profile Private
   ```

4. No app, crie `mobile/.env` com `EXPO_PUBLIC_API_URL=http://<IP>:5207` e reinicie o Expo.
5. Teste no navegador do celular: `http://<IP>:5207/api/health`.

O celular e o computador precisam estar na mesma rede Wi-Fi. A API também libera CORS (para o Expo Web e o site).

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
| PATCH | `/api/relatos/{id}/status` | corpo `{ "status": "aprovado", "motivo": "opcional" }`; `200` com o relato atualizado, `400` se o status for inválido, `404` se o relato não existir. Cada mudança fica registrada na tabela `moderacoes` |
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

## Testes manuais (Insomnia)

1. Suba a API (`dotnet run`).
2. No Insomnia: **Import** → `insomnia/moskitto-radar.insomnia.json`.
3. As requisições estão em pastas na ordem (health, consultar, criar, moderar, previsões, erros).
   O nome de cada uma diz o status esperado (ex.: `POST fora da região (Rio) → 400`).

Os POST usam a data atual (`now`), então não vencem. Os prints ficam em [`evidencias/`](evidencias/README.md).

## Pacote para o IIS (entrega para o Kato)

```powershell
powershell -ExecutionPolicy Bypass -File .\publicar.ps1
```

Gera `soa/publish/MoskittoRadar.Api.zip` (fora do git). O que o servidor precisa:

- **ASP.NET Core Hosting Bundle (.NET 10)** instalado; o `web.config` já vem no pacote (in-process).
- Pool de aplicativos **sem código gerenciado**.
- Permissão de escrita só na pasta `App_Data\` do site: o banco é criado lá na primeira execução,
  com as migrations e a carga inicial. Os dados de origem vão no pacote, em `Dados\`.
- Teste de vida: `http://<servidor>/api/health` → `{"status":"ok","banco":"ok",...}`.

Testado localmente em modo Production a partir do pacote: banco criado, 10.000 relatos carregados, OpenAPI desligado.

## Status

- [x] Domínio, banco e migrations
- [x] Carga do CSV simulado e das previsões
- [x] Rotas de consulta (health, relatos, previsões)
- [x] Rota de criação (POST) com validação e idempotência
- [x] Rota de moderação (PATCH)
- [x] Acesso pelo celular (perfil `celular` + CORS)
- [x] Coleção do Insomnia (25 requisições, todas conferidas)
- [ ] Prints das evidências
- [x] Pacote para o IIS (`publicar.ps1`)

Detalhes da disciplina: [`docs/disciplinas.md`](../docs/disciplinas.md#1-arquitetura-orientada-a-serviços-soa-e-web-services)
