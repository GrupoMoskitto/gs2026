namespace MoskittoRadar.Api.Models;

/// <summary>
/// Limites aceitos para um relato novo. Os mesmos do app (mobile/src/config/regiao.ts e utils/validacao.ts),
/// para os dois aceitarem e recusarem igual.
/// PROVISÓRIO: a caixa de coordenadas é decisão em aberto do time (AGENTS.md, seção 7, item 5). Mude só aqui.
/// </summary>
public static class Regiao
{
    public const double LatMin = -24.1, LatMax = -23.15, LngMin = -47.1, LngMax = -45.75;

    /// <summary>Relatos mais antigos que isso são recusados.</summary>
    public const int DiasMaximosAtras = 30;

    /// <summary>Folga para relógio de celular adiantado.</summary>
    public const int MinutosFolgaFuturo = 5;

    public static bool Contem(double latitude, double longitude) =>
        latitude is >= LatMin and <= LatMax && longitude is >= LngMin and <= LngMax;
}
