namespace MoskittoRadar.Api.Models;

// Formatos que a API devolve. Com a política snake_case do JSON, OcorridoEm vira "ocorrido_em" etc.
// Campos internos (criado_em, chave de idempotência) não saem na resposta.

/// <summary>Relato no formato comum do projeto (AGENTS.md, seção 4).</summary>
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
