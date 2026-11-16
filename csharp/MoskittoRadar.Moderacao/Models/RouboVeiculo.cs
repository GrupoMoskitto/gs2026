namespace MoskittoRadar.Moderacao.Models;

/// <summary>Roubo de carro ou moto. Sem placa: o projeto não guarda dado pessoal.</summary>
public class RouboVeiculo : Relato
{
    public RouboVeiculo(double latitude, double longitude, string bairro, DateTime ocorridoEm, string descricao,
        bool ehMoto)
        : base(latitude, longitude, bairro, ocorridoEm, descricao)
    {
        EhMoto = ehMoto;
    }

    public bool EhMoto { get; }

    public override string Tipo => "Veículo";

    // Roubo de veículo costuma ter abordagem armada: começa com prioridade maior.
    public override int CalcularPrioridade() =>
        Limitar(5 + PontosPorHorario() + (EhMoto ? 1 : 0));

    public override string Descrever() =>
        base.Descrever() + (EhMoto ? " · moto" : " · carro");
}
