namespace MoskittoRadar.Api.Models;

/// <summary>
/// Corpo do POST /api/relatos. Os campos chegam como texto/nullable para a API responder
/// com uma mensagem clara em português quando faltar algo ou vier valor errado.
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

/// <summary>
/// Caixa de coordenadas aceita (Região Metropolitana de São Paulo). Vem do appsettings.json, seção "Regiao".
/// PROVISÓRIO: é decisão em aberto do time (AGENTS.md, seção 7, item 5). Os valores padrão são os mesmos do app
/// (mobile/src/config/regiao.ts), para os dois aceitarem e recusarem igual.
/// </summary>
public class CaixaRegiao
{
    public double LatMin { get; set; } = -24.1;
    public double LatMax { get; set; } = -23.15;
    public double LngMin { get; set; } = -47.1;
    public double LngMax { get; set; } = -45.75;

    /// <summary>Relatos mais antigos que isso são recusados (o app usa o mesmo limite).</summary>
    public int DiasMaximosAtras { get; set; } = 30;

    /// <summary>Folga para relógio de celular adiantado.</summary>
    public int MinutosFolgaFuturo { get; set; } = 5;

    public bool Contem(double latitude, double longitude) =>
        latitude >= LatMin && latitude <= LatMax && longitude >= LngMin && longitude <= LngMax;
}
