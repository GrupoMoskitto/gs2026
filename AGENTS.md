# AGENTS.md: Mapa de Relatos de Roubo · GS CitizenTech FIAP 2026.2

Guia para qualquer agente de código (qualquer harness, IDE ou CLI) que for usado na GS.

> **Arquivo único.** Este `AGENTS.md` é a **única fonte de instruções** do repositório.
> O `CLAUDE.md` só importa este arquivo (`@AGENTS.md`) e **não deve ter conteúdo próprio**.
> Edite **somente aqui**. Se o seu agente não lê `AGENTS.md` sozinho, aponte para este arquivo no primeiro prompt.
> Mantenha o texto neutro: nada de instruções específicas de uma ferramenta.

Este arquivo fica na **raiz do monorepo**. Contexto completo da GS: [`docs/`](docs/README.md). Visão geral: [`README.md`](README.md).

## 1. O projeto

O morador relata um roubo pelo app (local, horário e tipo, sem dados pessoais). A API guarda os
relatos, um modelo de ML aponta onde e quando o risco é maior, e isso aparece no app.
Um app em C# modera os relatos e um botão de pânico (ESP32) também gera relatos.
Tudo roda num Windows Server com IIS.

- **Região:** Av. Paulista, São Paulo (bairros Bela Vista, Cerqueira César e Consolação)
- **Dados:** simulados. **Nenhum dado pessoal real.**
- **ODS:** 11 (principal), 9 e 10
- **Entrega:** quinta, 19/11, até 23h55, no Teams. Quem é dono da matéria faz o envio.

## 2. Quem faz o quê

| Pessoa | Nome completo · RM | Matérias | Pasta no repo |
|---|---|---|---|
| João | João Vitor de Matos · RM559246 | SOA · C# | `soa/` · `csharp/` |
| Coto | Gabriel Couto · RM559579 | IA/ML · Mobile | `ia/` · `mobile/` |
| Kato | Gabriel Kato · RM560000 | Operating Systems · Physical Computing (IoT) | `os/` · `physical/` |
| Marcelo | Marcelo Affonso · RM559790 | Cybersecurity · Testing (TC&QA) | `cyber/` · `testing/` |

## 3. Regras para o agente

1. Mexa só na parte pedida. Não altere a parte de outra pessoa.
2. Faça o simples que funciona primeiro. Extras só depois que os requisitos da seção 5 estiverem prontos.
3. Use o formato de dados da seção 4 exatamente como está.
4. Nada de dados pessoais reais (nome, CPF, telefone, placa). Só dados simulados, com a origem dita no README.
5. Escreva README, comentários e textos em português.
6. Toda parte tem um `README.md` com: o que é, como rodar e onde estão as evidências.
7. A GS exige registrar o uso de IA: acrescente cada prompt em `prompts.md`, **na pasta da matéria**
   (data, autor, prompt resumido, o que foi aceito). O autor tem que saber explicar o código gerado.
8. Pontos marcados como **(proposta)** ou listados na seção 7 ainda não foram decididos pelo time.
   Não trate como definitivo sem confirmação.

### Regras do app mobile e da API

Antes de mexer no `mobile/` ou na parte da API que o app consome, **leia [`mobile/REGRAS.md`](mobile/REGRAS.md)**.
Resumo: interface nativa (Liquid Glass no iOS, Material 3 no Android), mobile-first, skills de design,
referências do awesome-design, API pensada para rede ruim e a logo do projeto.

## 4. Formato comum dos dados

É o que faz as partes se encaixarem. Não mude sem combinar com o time.

**Relato**

```json
{
  "id": "3f2b6c1e-8a4d-4e7a-9b1f-2c5d6e7f8a90",
  "tipo": "celular",
  "descricao": "Levaram meu celular no ponto de ônibus",
  "latitude": -23.561,
  "longitude": -46.656,
  "bairro": "bela_vista",
  "ocorrido_em": "2026-11-10T21:35:00-03:00",
  "status": "pendente",
  "origem": "mobile"
}
```

- `tipo`: `celular`, `bolsa_mochila`, `veiculo`, `bicicleta`, `comercio`, `outro`
- `bairro`: `bela_vista`, `cerqueira_cesar`, `consolacao`
- `status`: `pendente` (padrão), `aprovado`, `rejeitado`
- `origem`: `mobile`, `desktop`, `iot`
- `descricao`: opcional, até 280 caracteres. Coordenadas com 3 casas decimais (não expor endereço exato).

**Previsão de risco** (gerada pelo ML)

```json
{ "bairro": "bela_vista", "faixa_horaria": "noite", "nivel_risco": "alto", "score": 0.82 }
```

- `faixa_horaria`: `madrugada` (0–6h), `manha` (6–12h), `tarde` (12–18h), `noite` (18–24h)
- `nivel_risco`: `baixo`, `medio`, `alto`

**Rotas da API**

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/health` | teste de vida (usado no IIS) |
| GET | `/api/relatos?bairro=&tipo=&status=` | lista com filtros |
| GET | `/api/relatos/{id}` | detalhe |
| POST | `/api/relatos` | cria relato → `201` (`400` com `{ "erro": "..." }` se inválido) |
| PATCH | `/api/relatos/{id}/status` | `{ "status": "aprovado" }` |
| GET | `/api/previsoes?bairro=` | previsões de risco |

**Dados simulados:** `relatos_simulados.csv` com as mesmas colunas do Relato, ~1.000 linhas,
gerado por um script Python com seed fixa (resultado sempre igual). Mais ocorrências à noite e perto
das estações Consolação, Trianon-Masp e Brigadeiro.

---

## 5. O que cada parte faz

Cada matéria tem: **stack**, **fazer**, **entregar** e **nota** (o que o professor avalia).

### João

#### SOA: `soa/`

- **Stack:** ASP.NET Core Web API (.NET 10) + Entity Framework Core + SQLite. Roda direto no IIS do Kato.
- **Fazer:**
  - Classes do domínio (Relato, PrevisaoRisco e os enums)
  - Banco conectado pelo EF Core, com **migrations**
  - As rotas da seção 4, com validação de entrada
  - Carregar o CSV simulado e as previsões do ML na primeira execução
  - Consultas só pelo EF Core, **nunca SQL montado com string** (o Marcelo usa isso como evidência)
  - Testar todas as rotas no **Insomnia** e salvar prints
- **Entregar:** link do GitHub · README (descrição, como rodar, integrantes) · evidências
- **Nota:** domínio 3,0 · banco 3,0 · migrações 2,5 · testes manuais 1,5

#### C#: `csharp/` (turma adaptada)

- **Stack:** C#/.NET 10, Windows Forms ou console. Dados simulados em memória. **Não usa a API** (ver seção 7, item 1).
- **Fazer:**
  - Classe abstrata `Relato` com `CalcularPrioridade()` e `Descrever()`
  - **Herança + polimorfismo:** `RouboCelular`, `RouboVeiculo`, `RouboBicicleta` sobrescrevendo esses métodos
  - `Usuario` → `Cidadao`, `Moderador` (o moderador aprova e rejeita)
  - **Encapsulamento:** campos privados + propriedades que validam (ex.: coordenada fora da Paulista dá erro)
  - Telas ou menu: listar, filtrar, ver detalhe, aprovar e rejeitar
  - Código organizado em pastas (`Models/`, `Services/`) e com nomes claros
  - **Não precisa:** interfaces, injeção de dependência, EF Core, LINQ, API, async, testes
  - **Versionamento semântico com pull request** (exigido no PDF da GS)
- **Entregar:** link do GitHub no Teams · README (descrição + como rodar) · prints do app funcionando.
  O PDF da GS também pede **ZIP do projeto + `.txt` com RM, nome completo e link do repositório**.
  Confirme com o professor se isso vale para a turma adaptada.
- **Nota:** POO 3,0 · qualidade do código 2,0 (o PDF da GS não traz rubrica de C#; confirme a origem e o total)

### Coto

#### IA/ML: `ia/`

- **Stack:** Python, pandas, scikit-learn, Jupyter ou Colab.
- **Fazer:**
  - Script que gera o `relatos_simulados.csv` (**até sex 13/11**, o João depende dele)
  - Notebook: carregar dados → análise → features (bairro, faixa horária, dia da semana) → modelo
    (ex.: RandomForest prevendo `nivel_risco`) → separar treino e teste → métrica (acurácia, F1)
  - Exportar `previsoes.json` no formato da seção 4 (é assim que a previsão aparece na solução)
  - Definir e documentar como `nivel_risco` é calculado para cada linha de treino (seção 7, item 3)
  - Declarar no README que os dados são **sintéticos** e como foram gerados
- **Entregar:** `.ipynb` + vídeo de até 2 min · repo com dataset, origem dos dados e README
- **Nota:** dados 2,0 · preparação 2,0 · modelo 3,0 · métrica 2,0 · integração 1,0

#### Mobile: `mobile/`

- **Stack:** React Native + Expo (Expo Go) + TypeScript. Seguir o `GS-MOBILE.pdf` e o `TUTORIAL-INSTALACAO.pdf` do Teams.
- **Fazer:**
  - TypeScript estrito, **sem `any`**: `npx tsc --noEmit` tem que sair limpo (sem isso, não tem nota)
  - App nativo: **WebView não vale**
  - Identificação com apelido + RM, lembrada ao reabrir
  - Lista de relatos (carregando, erro e vazio) → detalhe → cadastro de novo relato com validação
  - Localização do celular preenchendo o relato, **tratando a permissão negada**
  - Mostrar o risco da região (`/api/previsoes`)
  - **Tela de mapa** com os relatos e a cor por risco (**proposta**, ver seção 7, item 2)
  - Chamadas da API em `services/`, com dados de mentira (mock) se a API não responder
  - Mockup das telas em [`mobile/mockup/`](mobile/mockup/index.html)
- **Entregar:**
  - ZIP da pasta sem `node_modules`, com os RMs no nome do arquivo
  - README com a Ficha da CitizenTech no topo
  - `DECISOES.md` (1 a 2 páginas, **exigido no PDF da GS**)
  - `authors` com nome e RM de todos no `package.json`
  - **Vídeo demo de até 2 min**
- **Nota:** funcionalidade 40% · TypeScript 30% · recurso nativo 20% · organização e documentação 10%

### Kato

#### Operating Systems: `os/`

- **Stack:** Windows Server em VM, Active Directory, DNS, IIS, PowerShell.
- **Fazer:**
  - IP fixo, hostname, DNS e domínio no AD
  - IIS hospedando a API do João: instalar o **ASP.NET Core Hosting Bundle**, criar o site e o pool, dar
    permissão NTFS só na pasta do banco
  - Monitor de Desempenho com alertas de CPU, disco e memória
  - Recuperação automática do serviço e do pool + **teste de falha**
  - Logs no Visualizador de Eventos e logs do IIS
- **Entregar:** link do GitHub (README com a Ficha, roteiro, prints de `ipconfig`, `nslookup` e
  `Test-NetConnection`) + vídeo de até 7 min
- **Nota:** rede e AD 2 · IIS 2 · monitoramento 2 · tudo funcionando 2 · teste de falha 1 · logs 1

#### Physical Computing (IoT): `physical/`

- **Stack:** ESP32 no Wokwi, Arduino C++.
- **Fazer:**
  - Botão de pânico num ponto de ônibus: ao apertar, monta um Relato (`origem: "iot"`, local fixo) e faz
    `POST /api/relatos` pelo Wi-Fi `Wokwi-GUEST`
  - LED ou buzzer confirmando o envio
  - **Atenção:** o simulador provavelmente não alcança uma API em VM local. Trate a saída do JSON no
    Serial Monitor como caminho principal e o `POST` como extra (ou aponte para um endpoint público de teste).
- **Entregar:** link do Wokwi + vídeo de até 4 min (mostrando como o circuito entra na solução) + `.txt` com os integrantes
- **Nota:** o circuito tem que fazer parte da solução, não pode ser um projeto paralelo

### Marcelo

#### Cybersecurity: `cyber/`

- **Fazer:**
  - Relatório de gestão de riscos: ativos (banco de relatos, API, servidor), ameaças (vazamento de
    localização, relatos falsos, SQL Injection, LFI, OSINT), vulnerabilidades, riscos e controles
  - Evidências: código da API com consultas parametrizadas e validação de entrada, proteção contra LFI,
    scan NMAP no servidor do Kato mostrando só as portas necessárias
- **Entregar:** relatório em PDF com os prints e trechos de código
- **Nota:** ativos e ameaças 2,5 · vulnerabilidades e riscos 3,0 · controles 2,5 · evidências 2,0

#### Testing (TC&QA): `testing/`

- **Fazer:**
  - Diagrama no Archimate com 4 camadas: **Motivação** (quem ganha e por quê, ODS), **Negócios**
    (relatar, moderar, consultar risco), **Aplicação** (app, API, ML, app C#, ESP32), **Tecnologia**
    (Windows Server, IIS, SQLite, ESP32, celular)
  - Documento: nome do projeto, equipe com nome e RM, problema, público-alvo com estimativa de impacto
    baseada em estatísticas (citar a fonte)
  - Pitch: vídeo de até 4 min no YouTube (problema → solução funcionando → quem ajuda)
- **Entregar:** diagrama + documento + link do pitch
- **Nota:** cada camada 20% · nome e equipe 10% · público-alvo com dados 10%

---

## 6. Prazos internos

| Quando | O quê |
|---|---|
| sex 13/11 | Coto entrega o CSV simulado; João passa as rotas da API funcionando localmente |
| ter 17/11 | Cada parte funcionando sozinha |
| qua 18/11 | API no IIS, app mostrando o risco, vídeos gravados |
| qui 19/11, 23h55 | Cada dono envia a sua matéria no Teams |

## 7. Decisões em aberto

Ainda não decididas pelo time. Resolver antes de implementar o que depende delas.

1. **Fluxo de moderação.** O C# não usa a API, então ninguém chama `PATCH /api/relatos/{id}/status` e os
   relatos ficam `pendente`. Opções: o C# passa a chamar a API; ou o app mostra também os pendentes; ou
   o C# fica como demo isolada e o fluxo é descrito só na narrativa.
2. **Mapa.** A ideia original é um mapa interativo e dinâmico, mas não há tela de mapa nem página web no
   escopo. Proposta: tela de mapa no app mobile (pinos dos relatos aprovados, cor por risco).
3. **Granularidade do ML.** Com 3 bairros × 4 faixas há só 12 combinações, e o modelo vira uma tabela de
   consulta. Definir zonas mais finas (grade ou proximidade das estações) ou hora no lugar da faixa, e
   como `nivel_risco` é calculado nas linhas de treino.
4. **Front-end web.** Existe ou não. Se existir, quem faz e onde fica (provável: servido pela API, hospedado no IIS).
5. **Limites de coordenadas.** Uma única caixa (lat/long mínimo e máximo da região) para a API, o C# e o app validarem igual.
