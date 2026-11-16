namespace MoskittoRadar.Api.Models;

/// <summary>
/// Um dos 129 lugares da região (3 bairros da Paulista, 88 distritos da capital e 38 municípios).
/// A lista vem de ia/data/lugares.csv, a mesma que o app usa. O código é o valor do campo "bairro" do relato.
/// </summary>
public class Lugar
{
    /// <summary>Ex.: "bela_vista", "dis_355030801", "mun_3518800".</summary>
    public string Codigo { get; set; } = "";

    public string Nome { get; set; } = "";

    public TipoLugar Tipo { get; set; }

    /// <summary>Centro aproximado do lugar.</summary>
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    /// <summary>Código IBGE do município (os bairros e distritos da capital repetem o de São Paulo).</summary>
    public string CodIbge { get; set; } = "";
}
