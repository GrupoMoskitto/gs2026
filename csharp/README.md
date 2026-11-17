# Moskitto Radar · Moderação (C#)

App desktop em **Windows Forms** para moderar os relatos de roubo do Moskitto Radar, a CitizenTech da equipe na
GS FIAP 2026.2. O moderador vê a fila de relatos pendentes, ordenada por prioridade, e aprova ou rejeita cada um.

## Problema e pessoa beneficiada

- **Problema:** roubo de celular, bolsa, bicicleta e veículo na Região Metropolitana de São Paulo, começando pela
  Av. Paulista. Quem anda pela cidade não sabe onde e em que horário o risco é maior.
- **Quem ganha:** quem se desloca a pé ou de transporte público (estudantes, trabalhadores, idosos), que passa a
  consultar relatos da própria comunidade antes de sair.
- **Onde entra este app:** antes de um relato aparecer para todos, alguém precisa conferir se ele faz sentido.
  Este app é o terminal desse moderador.

## Vídeo

Apresentação do app de moderação (1 min 9 s): entrada, fila por prioridade, aprovar, rejeitar com motivo, novo relato e
as classes de POO. As telas são os prints de [`evidencias/`](evidencias/) e os relatos são simulados.

<!-- Cole aqui o link do vídeo: arraste o .mp4 para este README no editor do GitHub. -->

## Como rodar

Precisa do [.NET 10 SDK](https://dotnet.microsoft.com/download) no Windows.

```bash
cd csharp
dotnet run --project MoskittoRadar.Moderacao
```

Ou abra `MoskittoRadar.Moderacao.slnx` no Visual Studio e aperte F5.

1. Digite um apelido e escolha **Moderador** (aprova e rejeita) ou **Cidadão** (só consulta e relata).
2. A lista abre nos pendentes, do mais prioritário para o menos. Filtre por tipo, status e bairro.
3. Selecione um relato para ver o detalhe. **Aprovar** ou **Rejeitar** (pede o motivo).
4. **Novo relato** cadastra um roubo. Valores inválidos são recusados com uma mensagem.

Os relatos ficam em memória: são **simulados** (`Services/DadosSimulados.cs`) e voltam ao início ao fechar o app.
Nenhum dado pessoal real.

## Rodar no Linux

Windows Forms só existe no Windows. Para o Linux, `MoskittoRadar.Moderacao.Linux/` tem as mesmas três telas em
[Avalonia](https://avaloniaui.net), usando as **mesmas classes** de `Models/` e `Services/` (o projeto aponta para os
arquivos do projeto Windows, sem cópia). Só as telas mudam.

```bash
cd csharp
dotnet run --project MoskittoRadar.Moderacao.Linux
```

Diferente da versão Windows, esta lê e modera os relatos da **API** (`soa/`): a lista vem de `GET /api/relatos`,
aprovar e rejeitar chamam `PATCH /api/relatos/{id}/status` e o relato aprovado aparece no mapa do app. Suba a API
antes (`dotnet run` em `soa/MoskittoRadar.Api`). Outro endereço: variável `MODERACAO_API`.

O ZIP de entrega (`empacotar.ps1`) continua levando só a versão Windows.

## Como o código usa POO

| Conceito | Onde |
|---|---|
| **Classe abstrata** | `Relato` (com `CalcularPrioridade()` e `Descrever()`) e `Usuario` |
| **Herança** | `RouboCelular`, `RouboVeiculo`, `RouboBicicleta` herdam de `Relato`; `Cidadao` e `Moderador` herdam de `Usuario` |
| **Polimorfismo** | cada roubo calcula a prioridade do seu jeito (veículo começa mais alto, bicicleta compartilhada perde um ponto); a tela só pergunta `usuario.PodeModerar` |
| **Encapsulamento** | campos privados e propriedades que validam: coordenada fora da região, data no futuro, descrição acima de 280 caracteres, bairro vazio, apelido curto. O status só muda pela moderação, e só uma vez |

```
csharp/
├── MoskittoRadar.Moderacao/
│   ├── Models/     Relato e subclasses, Usuario, Cidadao, Moderador, StatusRelato
│   ├── Services/   RepositorioRelatos (lista em memória) e DadosSimulados
│   ├── Forms/      FormEntrada, FormPrincipal, FormNovoRelato
│   └── Program.cs
├── evidencias/     prints do app funcionando
├── CHANGELOG.md    versões (versionamento semântico)
├── entrega.txt     RM, nome completo e link do repositório
└── empacotar.ps1   gera o ZIP da entrega
```

**Prioridade (1 a 10):** base do tipo (celular 3, veículo 5, bicicleta 2) + 3 de madrugada ou 2 à noite, mais o
detalhe de cada tipo (transporte público +2, moto +1, bicicleta compartilhada −1).

## Tecnologias

C# 14, .NET 10, Windows Forms. Sem banco e sem API: os dados ficam em memória.

## Versões

Versionamento semântico (`MAIOR.MENOR.CORREÇÃO`), com a versão no `.csproj`, o histórico no
[`CHANGELOG.md`](CHANGELOG.md) e cada entrega por **pull request** na `main`.

## Entrega

```powershell
powershell -ExecutionPolicy Bypass -File .\empacotar.ps1
```

Gera `csharp/entrega/` com o ZIP do projeto (sem `bin/` e `obj/`) e o `entrega.txt`. Os dois vão para a tarefa do Teams.

## Equipe

| Nome | RM |
|---|---|
| João Vitor de Matos | RM559246 |
| Gabriel Couto | RM559579 |
| Gabriel Kato | RM560000 |
| Marcelo Affonso | RM559790 |
