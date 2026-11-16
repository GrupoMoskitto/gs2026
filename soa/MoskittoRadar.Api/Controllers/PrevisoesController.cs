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
    /// <summary>Previsões de risco do ML: as 516 (129 lugares × 4 faixas) ou, com ?bairro=, as 4 de um lugar.</summary>
    [HttpGet]
    public async Task<ActionResult<List<PrevisaoResposta>>> Listar(string? bairro, CancellationToken cancelamento)
    {
        var consulta = db.Previsoes.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(bairro))
        {
            if (!await db.LugarExiste(bairro, cancelamento))
                return BadRequest(new RespostaErro($"bairro \"{bairro}\" não existe na lista de 129 lugares."));
            consulta = consulta.Where(p => p.Bairro == bairro);
        }

        var previsoes = await consulta
            .Select(p => new PrevisaoResposta(p.Bairro, p.FaixaHoraria, p.NivelRisco, p.Score))
            .ToListAsync(cancelamento);

        // Ordena pela ordem do dia (madrugada → noite), não pela ordem alfabética do código no banco.
        return previsoes.OrderBy(p => p.Bairro).ThenBy(p => p.FaixaHoraria).ToList();
    }
}
