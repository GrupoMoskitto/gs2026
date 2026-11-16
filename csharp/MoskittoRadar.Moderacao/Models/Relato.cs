namespace MoskittoRadar.Moderacao.Models;

/// <summary>
/// Relato de roubo. Classe abstrata: cada tipo de roubo (celular, veículo, bicicleta) é uma subclasse
/// que calcula a própria prioridade e se descreve do seu jeito (polimorfismo).
/// Os campos são privados e só mudam pelas propriedades, que validam o valor (encapsulamento).
/// </summary>
public abstract class Relato
{
    public const int TamanhoMaximoDescricao = 280;

    // Caixa da Região Metropolitana de São Paulo: a mesma da API e do app.
    public const double LatMin = -24.1, LatMax = -23.15, LngMin = -47.1, LngMax = -45.75;

    private static int proximoId = 1;

    private double latitude;
    private double longitude;
    private string bairro = "";
    private string descricao = "";
    private DateTime ocorridoEm;

    protected Relato(double latitude, double longitude, string bairro, DateTime ocorridoEm, string descricao)
    {
        Id = proximoId++;
        Latitude = latitude;
        Longitude = longitude;
        Bairro = bairro;
        OcorridoEm = ocorridoEm;
        Descricao = descricao;
        Status = StatusRelato.Pendente;
    }

    public int Id { get; }

    /// <summary>Nome do tipo para mostrar na tela (ex.: "Celular").</summary>
    public abstract string Tipo { get; }

    public double Latitude
    {
        get => latitude;
        set
        {
            if (value < LatMin || value > LatMax)
                throw new ArgumentException($"Latitude {value} fora da Região Metropolitana de São Paulo ({LatMin} a {LatMax}).");
            latitude = Math.Round(value, 3, MidpointRounding.AwayFromZero); // 3 casas (~100 m): não expõe o endereço exato
        }
    }

    public double Longitude
    {
        get => longitude;
        set
        {
            if (value < LngMin || value > LngMax)
                throw new ArgumentException($"Longitude {value} fora da Região Metropolitana de São Paulo ({LngMin} a {LngMax}).");
            longitude = Math.Round(value, 3, MidpointRounding.AwayFromZero);
        }
    }

    public string Bairro
    {
        get => bairro;
        set
        {
            if (string.IsNullOrWhiteSpace(value))
                throw new ArgumentException("Informe o bairro.");
            bairro = value.Trim();
        }
    }

    public DateTime OcorridoEm
    {
        get => ocorridoEm;
        set
        {
            if (value > DateTime.Now)
                throw new ArgumentException("A data do roubo não pode estar no futuro.");
            ocorridoEm = value;
        }
    }

    /// <summary>Opcional, até 280 caracteres.</summary>
    public string Descricao
    {
        get => descricao;
        set
        {
            var texto = (value ?? "").Trim();
            if (texto.Length > TamanhoMaximoDescricao)
                throw new ArgumentException($"A descrição pode ter até {TamanhoMaximoDescricao} caracteres.");
            descricao = texto;
        }
    }

    /// <summary>Só muda pela moderação (método MudarStatus).</summary>
    public StatusRelato Status { get; private set; }

    public string ModeradoPor { get; private set; } = "";

    public string Motivo { get; private set; } = "";

    /// <summary>Prioridade de 1 (baixa) a 10 (alta) para a fila de moderação. Cada tipo calcula a sua.</summary>
    public abstract int CalcularPrioridade();

    /// <summary>Resumo de uma linha para a lista. As subclasses acrescentam os próprios detalhes.</summary>
    public virtual string Descrever() =>
        $"#{Id} {Tipo} em {Bairro}, {OcorridoEm:dd/MM HH:mm} ({Status})";

    /// <summary>
    /// Decisão do moderador. Só relato pendente pode ser decidido, e rejeitar exige um motivo.
    /// É chamado pela classe Moderador.
    /// </summary>
    public void MudarStatus(StatusRelato novoStatus, Moderador moderador, string motivo)
    {
        if (Status != StatusRelato.Pendente)
            throw new InvalidOperationException($"O relato #{Id} já foi {Status.ToString().ToLower()}.");
        if (novoStatus == StatusRelato.Pendente)
            throw new ArgumentException("Escolha aprovar ou rejeitar.");
        if (novoStatus == StatusRelato.Rejeitado && string.IsNullOrWhiteSpace(motivo))
            throw new ArgumentException("Informe o motivo da rejeição.");

        Status = novoStatus;
        ModeradoPor = moderador.Apelido;
        Motivo = (motivo ?? "").Trim();
    }

    /// <summary>Pontos extras pelo horário: à noite e de madrugada a rua fica mais vazia.</summary>
    protected int PontosPorHorario()
    {
        var hora = OcorridoEm.Hour;
        if (hora < 6) return 3;   // madrugada
        if (hora >= 18) return 2; // noite
        return 0;
    }

    /// <summary>Mantém a prioridade entre 1 e 10.</summary>
    protected static int Limitar(int prioridade) => Math.Clamp(prioridade, 1, 10);
}
