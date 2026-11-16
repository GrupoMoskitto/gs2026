using Microsoft.AspNetCore.Mvc;
using MoskittoRadar.Api.Data;
using MoskittoRadar.Api.Models;

namespace MoskittoRadar.Api.Controllers;

[ApiController]
[Route("api/health")]
[Produces("application/json")]
public class HealthController(AppDbContext db) : ControllerBase
{
    /// <summary>Teste de vida, usado no IIS e no monitoramento. 200 se a API e o banco respondem; 503 se o banco falhar.</summary>
    [HttpGet]
    public async Task<IActionResult> Verificar(CancellationToken cancelamento)
    {
        if (!await db.Database.CanConnectAsync(cancelamento))
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new RespostaErro("Banco de dados indisponível."));

        return Ok(new { Status = "ok", Banco = "ok", Horario = DateTimeOffset.UtcNow });
    }
}
