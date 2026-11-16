using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Data;
using MoskittoRadar.Api.Models;

namespace MoskittoRadar.Api.Controllers;

[ApiController]
[Route("api/relatos")]
[Produces("application/json")]
public class RelatosController(AppDbContext db) : ControllerBase
{
    public const int LimitePadrao = 200;
    public const int LimiteMaximo = 1000;

    /// <summary>
    /// Lista os relatos, do mais recente para o mais antigo. Filtros opcionais: bairro, tipo e status.
    /// Devolve um array com até <see cref="LimitePadrao"/> itens (mude com ?limite=, até <see cref="LimiteMaximo"/>).
    /// O total sem o limite vai no cabeçalho X-Total-Count.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<RelatoResposta>>> Listar(
        [FromQuery] string? bairro,
        [FromQuery] string? tipo,
        [FromQuery] string? status,
        [FromQuery] string? limite,
        CancellationToken cancelamento)
    {
        var quantidade = LimitePadrao;
        if (!string.IsNullOrWhiteSpace(limite)
            && (!int.TryParse(limite, out quantidade) || quantidade < 1 || quantidade > LimiteMaximo))
            return BadRequest(new RespostaErro($"limite deve ser um número de 1 a {LimiteMaximo}."));

        // Todos os filtros entram como parâmetros do LINQ: o EF Core gera SQL parametrizado.
        IQueryable<Relato> consulta = db.Relatos.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(bairro))
        {
            if (!await db.Lugares.AnyAsync(l => l.Codigo == bairro, cancelamento))
                return BadRequest(new RespostaErro($"bairro \"{bairro}\" não existe na lista de 129 lugares."));
            consulta = consulta.Where(r => r.Bairro == bairro);
        }

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            if (!CodigoEnumConverter<TipoRelato>.TentarLer(tipo, out var valorTipo))
                return BadRequest(new RespostaErro("tipo deve ser celular, bolsa_mochila, veiculo, bicicleta, comercio ou outro."));
            consulta = consulta.Where(r => r.Tipo == valorTipo);
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!CodigoEnumConverter<StatusRelato>.TentarLer(status, out var valorStatus))
                return BadRequest(new RespostaErro("status deve ser pendente, aprovado ou rejeitado."));
            consulta = consulta.Where(r => r.Status == valorStatus);
        }

        Response.Headers["X-Total-Count"] = (await consulta.CountAsync(cancelamento)).ToString();

        var relatos = await consulta
            .OrderByDescending(r => r.OcorridoEm)
            .ThenBy(r => r.Id)
            .Take(quantidade)
            .Select(r => new RelatoResposta(r.Id, r.Tipo, r.Descricao, r.Latitude, r.Longitude, r.Bairro, r.OcorridoEm, r.Status, r.Origem))
            .ToListAsync(cancelamento);

        return relatos;
    }

    /// <summary>Detalhe de um relato. 404 se o id não existir (ou nem for um id válido).</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<RelatoResposta>> Obter(string id, CancellationToken cancelamento)
    {
        if (!Guid.TryParse(id, out var guid))
            return NotFound(new RespostaErro("Relato não encontrado."));

        var relato = await db.Relatos.AsNoTracking().FirstOrDefaultAsync(r => r.Id == guid, cancelamento);
        if (relato is null)
            return NotFound(new RespostaErro("Relato não encontrado."));

        return RelatoResposta.De(relato);
    }
}
