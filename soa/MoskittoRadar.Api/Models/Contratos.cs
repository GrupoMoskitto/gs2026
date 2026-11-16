namespace MoskittoRadar.Api.Models;

// O que entra e sai da API. Com a política snake_case do JSON, OcorridoEm vira "ocorrido_em" etc.

/// <summary>
/// Corpo do POST /api/relatos. Campos como texto/nullable para a API responder com mensagem clara em português.
/// id e status não são aceitos do cliente: a API gera o id e todo relato novo começa pendente.
/// </summary>
public record NovoRelato(
    string? Tipo,
    string? Descricao,
    double? Latitude,
    double? Longitude,
    string? Bairro,
    DateTimeOffset? OcorridoEm,
    string? Origem);

/// <summary>Corpo do PATCH /api/relatos/{id}/status. motivo é opcional.</summary>
public record MudancaStatus(string? Status, string? Motivo);

/// <summary>Relato no formato comum do projeto (AGENTS.md, seção 4). Campos internos não saem.</summary>
public record RelatoResposta(
    Guid Id,
    TipoRelato Tipo,
    string? Descricao,
    double Latitude,
    double Longitude,
    string Bairro,
    DateTimeOffset OcorridoEm,
    StatusRelato Status,
    OrigemRelato Origem)
{
    public static RelatoResposta De(Relato r) =>
        new(r.Id, r.Tipo, r.Descricao, r.Latitude, r.Longitude, r.Bairro, r.OcorridoEm, r.Status, r.Origem);
}

/// <summary>Previsão de risco no formato comum do projeto.</summary>
public record PrevisaoResposta(string Bairro, FaixaHoraria FaixaHoraria, NivelRisco NivelRisco, double Score);

/// <summary>Todo erro da API sai assim: { "erro": "mensagem" }.</summary>
public record RespostaErro(string Erro);
