using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Data;
using MoskittoRadar.Api.Models;

namespace MoskittoRadar.Api.Controllers;

[ApiController]
[Route("api/previsoes")]
[Produces("application/json")]
public class PrevisoesController(AppDbContext db) : ControllerBase
{
    /// <summary>
    /// Previsões de risco do modelo de ML. Sem filtro, devolve as 516 (129 lugares × 4 faixas);
    /// com ?bairro=, só as 4 faixas daquele lugar.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<PrevisaoResposta>>> Listar([FromQuery] string? bairro, CancellationToken cancelamento)
    {
        IQueryable<PrevisaoRisco> consulta = db.Previsoes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(bairro))
        {
            if (!await db.Lugares.AnyAsync(l => l.Codigo == bairro, cancelamento))
                return BadRequest(new RespostaErro($"bairro \"{bairro}\" não existe na lista de 129 lugares."));
            consulta = consulta.Where(p => p.Bairro == bairro);
        }

        var previsoes = await consulta
            .Select(p => new PrevisaoResposta(p.Bairro, p.FaixaHoraria, p.NivelRisco, p.Score))
            .ToListAsync(cancelamento);

        // Ordena pela ordem do dia (madrugada → noite), não pela ordem alfabética do código guardado no banco.
        return previsoes.OrderBy(p => p.Bairro).ThenBy(p => p.FaixaHoraria).ToList();
    }
}
