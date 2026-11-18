namespace MoskittoRadar.Api.Models;

/// <summary>
/// Relato de roubo feito por um morador (app), pelo moderador (desktop) ou por um dispositivo no ponto de ônibus (IoT).
/// Não guarda nenhum dado pessoal: só local aproximado, horário e tipo.
/// </summary>
public class Relato
{
    public const int TamanhoMaximoDescricao = 280;

    public Guid Id { get; set; } = Guid.NewGuid();

    public TipoRelato Tipo { get; set; }

    /// <summary>Opcional, até 280 caracteres.</summary>
    public string? Descricao { get; set; }

    /// <summary>Com 3 casas decimais (cerca de 100 m), para não expor o endereço exato.</summary>
    public double Latitude { get; set; }

    public double Longitude { get; set; }

    /// <summary>Código do lugar (ver <see cref="Lugar"/>). O nome "bairro" foi mantido para não quebrar a API.</summary>
    public string Bairro { get; set; } = "";

    public Lugar? Lugar { get; set; }

    /// <summary>Quando o roubo aconteceu, com o fuso de quem relatou (ex.: -03:00).</summary>
    public DateTimeOffset OcorridoEm { get; set; }

    /// <summary>Quando a API recebeu o relato.</summary>
    public DateTimeOffset CriadoEm { get; set; } = DateTimeOffset.UtcNow;

    public StatusRelato Status { get; set; } = StatusRelato.Pendente;

    public OrigemRelato Origem { get; set; }

    /// <summary>
    /// Valor do cabeçalho Idempotency-Key enviado pelo app. Se o mesmo relato chegar duas vezes
    /// (rede ruim, fila offline), a API devolve o que já existe em vez de criar outro.
    /// </summary>
    public string? ChaveIdempotencia { get; set; }

    public List<Moderacao> Moderacoes { get; set; } = [];

    /// <summary>Muda o status e registra a decisão no histórico de moderação.</summary>
    public Moderacao Moderar(StatusRelato novoStatus, string? motivo = null, string? moderadoPor = null)
    {
        var moderacao = new Moderacao
        {
            RelatoId = Id,
            StatusAnterior = Status,
            Decisao = novoStatus,
            Motivo = motivo,
            ModeradoPor = moderadoPor,
        };
        Status = novoStatus;
        Moderacoes.Add(moderacao);
        return moderacao;
    }

    /// <summary>Arredonda para 3 casas decimais, como pede o formato comum.</summary>
    public static double ArredondarCoordenada(double valor) => Math.Round(valor, 3, MidpointRounding.AwayFromZero);
}
