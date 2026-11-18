namespace MoskittoRadar.Api.Models;

/// <summary>
/// Histórico de cada mudança de status de um relato (PATCH /api/relatos/{id}/status).
/// Mostra quem estava pendente, o que foi decidido e quando.
/// </summary>
public class Moderacao
{
    public int Id { get; set; }

    public Guid RelatoId { get; set; }

    public Relato? Relato { get; set; }

    public StatusRelato StatusAnterior { get; set; }

    public StatusRelato Decisao { get; set; }

    /// <summary>Opcional. Ex.: "relato duplicado".</summary>
    public string? Motivo { get; set; }

    /// <summary>Apelido do moderador que decidiu. Vem da chave enviada, não do corpo da requisição.</summary>
    public string? ModeradoPor { get; set; }

    public DateTimeOffset DecididoEm { get; set; } = DateTimeOffset.UtcNow;
}
