namespace MoskittoRadar.Api.Models;

/// <summary>
/// Previsão de risco gerada pelo modelo de ML do Coto (ia/data/previsoes.json):
/// uma linha por lugar e faixa horária, 129 × 4 = 516 linhas.
/// </summary>
public class PrevisaoRisco
{
    public int Id { get; set; }

    /// <summary>Código do lugar (ver <see cref="Lugar"/>).</summary>
    public string Bairro { get; set; } = "";

    public Lugar? Lugar { get; set; }

    public FaixaHoraria FaixaHoraria { get; set; }

    public NivelRisco NivelRisco { get; set; }

    /// <summary>Entre 0 e 1. Quanto maior, mais roubos esperados.</summary>
    public double Score { get; set; }

    /// <summary>Quando a previsão foi carregada no banco.</summary>
    public DateTimeOffset GeradoEm { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Faixa horária de um horário qualquer (0–6 madrugada, 6–12 manhã, 12–18 tarde, 18–24 noite).</summary>
    public static FaixaHoraria FaixaDe(DateTimeOffset momento) => momento.Hour switch
    {
        < 6 => FaixaHoraria.Madrugada,
        < 12 => FaixaHoraria.Manha,
        < 18 => FaixaHoraria.Tarde,
        _ => FaixaHoraria.Noite,
    };
}
