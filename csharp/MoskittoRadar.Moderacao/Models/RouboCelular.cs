namespace MoskittoRadar.Moderacao.Models;

/// <summary>Roubo de celular, o mais comum na região.</summary>
public class RouboCelular : Relato
{
    public RouboCelular(double latitude, double longitude, string bairro, DateTime ocorridoEm, string descricao,
        bool noTransportePublico)
        : base(latitude, longitude, bairro, ocorridoEm, descricao)
    {
        NoTransportePublico = noTransportePublico;
    }

    /// <summary>Aconteceu em ônibus, metrô ou ponto de ônibus.</summary>
    public bool NoTransportePublico { get; }

    public override string Tipo => "Celular";

    public override int CalcularPrioridade() =>
        Limitar(3 + PontosPorHorario() + (NoTransportePublico ? 2 : 0));

    public override string Descrever() =>
        base.Descrever() + (NoTransportePublico ? " · transporte público" : "");
}
