namespace MoskittoRadar.Moderacao.Models;

/// <summary>Roubo de bicicleta, própria ou de aluguel (compartilhada).</summary>
public class RouboBicicleta : Relato
{
    public RouboBicicleta(double latitude, double longitude, string bairro, DateTime ocorridoEm, string descricao,
        bool compartilhada)
        : base(latitude, longitude, bairro, ocorridoEm, descricao)
    {
        Compartilhada = compartilhada;
    }

    public bool Compartilhada { get; }

    public override string Tipo => "Bicicleta";

    // Bicicleta compartilhada tem rastreador e dono (a empresa): prioridade um pouco menor.
    public override int CalcularPrioridade() =>
        Limitar(2 + PontosPorHorario() - (Compartilhada ? 1 : 0));

    public override string Descrever() =>
        base.Descrever() + (Compartilhada ? " · compartilhada" : "");
}
