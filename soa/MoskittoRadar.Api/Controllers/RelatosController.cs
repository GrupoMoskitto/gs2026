using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
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

    public const int TamanhoMaximoChave = 100;

    /// <summary>
    /// Cria um relato (status sempre "pendente"). 201 com o relato criado; 400 com { "erro": "..." } se inválido.
    /// Com o cabeçalho Idempotency-Key, reenviar o mesmo relato (rede ruim, fila offline do app) não duplica:
    /// a API devolve 200 com o relato que já foi criado com aquela chave.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RelatoResposta>> Criar(
        [FromBody] NovoRelato? novo,
        [FromHeader(Name = "Idempotency-Key")] string? chave,
        [FromServices] IOptions<CaixaRegiao> regiao,
        CancellationToken cancelamento)
    {
        chave = string.IsNullOrWhiteSpace(chave) ? null : chave.Trim();
        if (chave is { Length: > TamanhoMaximoChave })
            return BadRequest(new RespostaErro($"Idempotency-Key pode ter até {TamanhoMaximoChave} caracteres."));

        // Mesma chave de antes: é um reenvio. Devolve o relato original em vez de criar outro.
        if (chave is not null && await BuscarPorChave(chave, cancelamento) is { } existente)
            return Reenvio(existente);

        if (novo is null)
            return BadRequest(new RespostaErro("Envie o relato no corpo da requisição, em JSON."));

        var erros = await Validar(novo, regiao.Value, cancelamento);
        if (erros.Count > 0)
            return BadRequest(new RespostaErro(string.Join(" ", erros)));

        var descricao = novo.Descricao?.Trim();
        var relato = new Relato
        {
            Tipo = CodigoEnumConverter<TipoRelato>.DeCodigo(novo.Tipo!),
            Descricao = string.IsNullOrEmpty(descricao) ? null : descricao,
            Latitude = Relato.ArredondarCoordenada(novo.Latitude!.Value),
            Longitude = Relato.ArredondarCoordenada(novo.Longitude!.Value),
            Bairro = novo.Bairro!,
            OcorridoEm = novo.OcorridoEm!.Value,
            Origem = CodigoEnumConverter<OrigemRelato>.DeCodigo(novo.Origem!),
            Status = StatusRelato.Pendente,
            ChaveIdempotencia = chave,
        };

        db.Relatos.Add(relato);
        try
        {
            await db.SaveChangesAsync(cancelamento);
        }
        catch (DbUpdateException erro) when (chave is not null && erro.InnerException is SqliteException { SqliteErrorCode: 19 })
        {
            // Dois envios com a mesma chave chegaram juntos e o outro gravou primeiro (índice único): é reenvio.
            db.ChangeTracker.Clear();
            if (await BuscarPorChave(chave, cancelamento) is { } gravado)
                return Reenvio(gravado);
            throw;
        }

        return CreatedAtAction(nameof(Obter), new { id = relato.Id }, RelatoResposta.De(relato));
    }

    /// <summary>Moderação: muda o status do relato e guarda a decisão na tabela moderacoes. 200 com o relato atualizado.</summary>
    [HttpPatch("{id}/status")]
    public async Task<ActionResult<RelatoResposta>> MudarStatus(string id, [FromBody] MudancaStatus? mudanca, CancellationToken cancelamento)
    {
        if (!CodigoEnumConverter<StatusRelato>.TentarLer(mudanca?.Status, out var status))
            return BadRequest(new RespostaErro("status deve ser pendente, aprovado ou rejeitado."));

        var motivo = mudanca!.Motivo?.Trim();
        if (motivo?.Length > 200)
            return BadRequest(new RespostaErro("motivo pode ter até 200 caracteres."));

        if (!Guid.TryParse(id, out var guid) || await db.Relatos.FindAsync([guid], cancelamento) is not { } relato)
            return NotFound(new RespostaErro("Relato não encontrado."));

        relato.Moderar(status, string.IsNullOrEmpty(motivo) ? null : motivo);
        await db.SaveChangesAsync(cancelamento);
        return RelatoResposta.De(relato);
    }

    private Task<Relato?> BuscarPorChave(string chave, CancellationToken cancelamento) =>
        db.Relatos.AsNoTracking().FirstOrDefaultAsync(r => r.ChaveIdempotencia == chave, cancelamento);

    private OkObjectResult Reenvio(Relato relato)
    {
        Response.Headers["Idempotent-Replayed"] = "true";
        return Ok(RelatoResposta.De(relato));
    }

    /// <summary>Confere o relato novo. Devolve a lista de problemas (vazia se estiver tudo certo).</summary>
    private async Task<List<string>> Validar(NovoRelato novo, CaixaRegiao regiao, CancellationToken cancelamento)
    {
        var erros = new List<string>();

        if (string.IsNullOrWhiteSpace(novo.Tipo))
            erros.Add("tipo é obrigatório.");
        else if (!CodigoEnumConverter<TipoRelato>.TentarLer(novo.Tipo, out _))
            erros.Add("tipo deve ser celular, bolsa_mochila, veiculo, bicicleta, comercio ou outro.");

        if (novo.Descricao?.Trim().Length > Relato.TamanhoMaximoDescricao)
            erros.Add($"descricao pode ter até {Relato.TamanhoMaximoDescricao} caracteres.");

        if (novo.Latitude is null || novo.Longitude is null)
            erros.Add("latitude e longitude são obrigatórias.");
        else if (!regiao.Contem(novo.Latitude.Value, novo.Longitude.Value))
            erros.Add(string.Create(CultureInfo.InvariantCulture, // ponto decimal, não vírgula
                $"latitude e longitude precisam estar na Região Metropolitana de São Paulo " +
                $"(latitude de {regiao.LatMin} a {regiao.LatMax}, longitude de {regiao.LngMin} a {regiao.LngMax})."));

        if (string.IsNullOrWhiteSpace(novo.Bairro))
            erros.Add("bairro é obrigatório.");
        else if (!await db.Lugares.AnyAsync(l => l.Codigo == novo.Bairro, cancelamento))
            erros.Add($"bairro \"{novo.Bairro}\" não existe na lista de 129 lugares.");

        var agora = DateTimeOffset.UtcNow;
        if (novo.OcorridoEm is null)
            erros.Add("ocorrido_em é obrigatório (ex.: 2026-11-10T21:35:00-03:00).");
        else if (novo.OcorridoEm > agora.AddMinutes(regiao.MinutosFolgaFuturo))
            erros.Add("ocorrido_em não pode estar no futuro.");
        else if (novo.OcorridoEm < agora.AddDays(-regiao.DiasMaximosAtras))
            erros.Add($"ocorrido_em precisa estar nos últimos {regiao.DiasMaximosAtras} dias.");

        if (string.IsNullOrWhiteSpace(novo.Origem))
            erros.Add("origem é obrigatória.");
        else if (!CodigoEnumConverter<OrigemRelato>.TentarLer(novo.Origem, out _))
            erros.Add("origem deve ser mobile, desktop ou iot.");

        return erros;
    }
}
