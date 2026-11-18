using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Data;
using MoskittoRadar.Api.Models;
using MoskittoRadar.Api.Seguranca;

namespace MoskittoRadar.Api.Controllers;

[ApiController]
[Route("api/relatos")]
[Produces("application/json")]
public class RelatosController(AppDbContext db, ILogger<RelatosController> logger) : ControllerBase
{
    private const int LimitePadrao = 200, LimiteMaximo = 1000, TamanhoMaximoChave = 100, TamanhoMaximoMotivo = 200;
    private const string ErroTipo = "tipo deve ser celular, bolsa_mochila, veiculo, bicicleta, comercio ou outro.";
    private const string ErroStatus = "status deve ser pendente, aprovado ou rejeitado.";
    private const string ErroOrigem = "origem deve ser mobile, desktop ou iot.";
    private static readonly RespostaErro NaoEncontrado = new("Relato não encontrado.");

    private static string ErroBairro(string bairro) => $"bairro \"{bairro}\" não existe na lista de 129 lugares.";

    /// <summary>
    /// Lista os relatos, do mais recente para o mais antigo, com filtros opcionais.
    /// Devolve até 200 itens (?limite= até 1000); o total sem o limite vai no cabeçalho X-Total-Count.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<RelatoResposta>>> Listar(
        string? bairro, string? tipo, string? status, int? limite, CancellationToken cancelamento)
    {
        if (limite is < 1 or > LimiteMaximo)
            return BadRequest(new RespostaErro($"limite deve ser um número de 1 a {LimiteMaximo}."));

        // Os filtros entram como parâmetros do LINQ: o EF Core gera SQL parametrizado.
        var consulta = db.Relatos.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(bairro))
        {
            if (!await db.LugarExiste(bairro, cancelamento)) return BadRequest(new RespostaErro(ErroBairro(bairro)));
            consulta = consulta.Where(r => r.Bairro == bairro);
        }
        if (!string.IsNullOrWhiteSpace(tipo))
        {
            if (!CodigoEnumConverter<TipoRelato>.TentarLer(tipo, out var valor)) return BadRequest(new RespostaErro(ErroTipo));
            consulta = consulta.Where(r => r.Tipo == valor);
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (!CodigoEnumConverter<StatusRelato>.TentarLer(status, out var valor)) return BadRequest(new RespostaErro(ErroStatus));
            consulta = consulta.Where(r => r.Status == valor);
        }

        Response.Headers["X-Total-Count"] = (await consulta.CountAsync(cancelamento)).ToString();

        return await consulta
            .OrderByDescending(r => r.OcorridoEm)
            .ThenBy(r => r.Id)
            .Take(limite ?? LimitePadrao)
            .Select(r => new RelatoResposta(r.Id, r.Tipo, r.Descricao, r.Latitude, r.Longitude, r.Bairro, r.OcorridoEm, r.Status, r.Origem))
            .ToListAsync(cancelamento);
    }

    /// <summary>Detalhe de um relato. 404 se o id não existir (ou nem for um id válido).</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<RelatoResposta>> Obter(string id, CancellationToken cancelamento)
    {
        if (!Guid.TryParse(id, out var guid) || await db.Relatos.FindAsync([guid], cancelamento) is not { } relato)
            return NotFound(NaoEncontrado);
        return RelatoResposta.De(relato);
    }

    /// <summary>
    /// Cria um relato (sempre "pendente"): 201, ou 400 com { "erro": "..." } se inválido.
    /// Com o cabeçalho Idempotency-Key, reenviar o mesmo relato (rede ruim, fila offline do app) não duplica:
    /// a API devolve 200 com o relato já criado com aquela chave.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RelatoResposta>> Criar(
        NovoRelato? novo, [FromHeader(Name = "Idempotency-Key")] string? chave, CancellationToken cancelamento)
    {
        chave = string.IsNullOrWhiteSpace(chave) ? null : chave.Trim();
        if (chave?.Length > TamanhoMaximoChave)
            return BadRequest(new RespostaErro($"Idempotency-Key pode ter até {TamanhoMaximoChave} caracteres."));

        if (chave is not null && await BuscarPorChave(chave, cancelamento) is { } existente)
            return Reenvio(existente);

        if (novo is null)
            return BadRequest(new RespostaErro("Envie o relato no corpo da requisição, em JSON."));

        var erros = await Validar(novo, cancelamento);
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
            ChaveIdempotencia = chave,
        };
        db.Relatos.Add(relato);

        try
        {
            await db.SaveChangesAsync(cancelamento);
        }
        catch (DbUpdateException erro) when (chave is not null && erro.InnerException is SqliteException { SqliteErrorCode: 19 })
        {
            // Dois envios com a mesma chave ao mesmo tempo: o índice único barrou este. Devolve o que foi gravado.
            db.ChangeTracker.Clear();
            return Reenvio((await BuscarPorChave(chave, cancelamento))!);
        }

        return CreatedAtAction(nameof(Obter), new { id = relato.Id }, RelatoResposta.De(relato));
    }

    /// <summary>
    /// Moderação: muda o status e grava a decisão, com o apelido do moderador, na tabela moderacoes.
    /// Exige a chave de um moderador (401 sem ela). 200 com o relato atualizado.
    /// </summary>
    [HttpPatch("{id}/status")]
    [ExigeModerador]
    public async Task<ActionResult<RelatoResposta>> MudarStatus(string id, MudancaStatus? mudanca, CancellationToken cancelamento)
    {
        if (!CodigoEnumConverter<StatusRelato>.TentarLer(mudanca?.Status, out var status))
            return BadRequest(new RespostaErro(ErroStatus));

        var motivo = mudanca!.Motivo?.Trim();
        if (motivo?.Length > TamanhoMaximoMotivo)
            return BadRequest(new RespostaErro($"motivo pode ter até {TamanhoMaximoMotivo} caracteres."));

        if (!Guid.TryParse(id, out var guid) || await db.Relatos.FindAsync([guid], cancelamento) is not { } relato)
            return NotFound(NaoEncontrado);

        var moderador = (string)HttpContext.Items[ExigeModeradorAttribute.ItemApelido]!;
        relato.Moderar(status, string.IsNullOrEmpty(motivo) ? null : motivo, moderador);
        await db.SaveChangesAsync(cancelamento);
        logger.LogInformation("Relato {Id} ficou {Status}, por {Moderador}", relato.Id, status, moderador);
        return RelatoResposta.De(relato);
    }

    private Task<Relato?> BuscarPorChave(string chave, CancellationToken cancelamento) =>
        db.Relatos.AsNoTracking().FirstOrDefaultAsync(r => r.ChaveIdempotencia == chave, cancelamento);

    private OkObjectResult Reenvio(Relato relato)
    {
        Response.Headers["Idempotent-Replayed"] = "true";
        return Ok(RelatoResposta.De(relato));
    }

    /// <summary>Confere o relato novo e devolve a lista de problemas (vazia se estiver tudo certo).</summary>
    private async Task<List<string>> Validar(NovoRelato novo, CancellationToken cancelamento)
    {
        var erros = new List<string>();

        if (string.IsNullOrWhiteSpace(novo.Tipo)) erros.Add("tipo é obrigatório.");
        else if (!CodigoEnumConverter<TipoRelato>.TentarLer(novo.Tipo, out _)) erros.Add(ErroTipo);

        if (novo.Descricao?.Trim().Length > Relato.TamanhoMaximoDescricao)
            erros.Add($"descricao pode ter até {Relato.TamanhoMaximoDescricao} caracteres.");

        if (novo.Latitude is null || novo.Longitude is null)
            erros.Add("latitude e longitude são obrigatórias.");
        else if (!Regiao.Contem(novo.Latitude.Value, novo.Longitude.Value))
            erros.Add(string.Create(CultureInfo.InvariantCulture, // ponto decimal, não vírgula
                $"latitude e longitude precisam estar na Região Metropolitana de São Paulo " +
                $"(latitude de {Regiao.LatMin} a {Regiao.LatMax}, longitude de {Regiao.LngMin} a {Regiao.LngMax})."));

        if (string.IsNullOrWhiteSpace(novo.Bairro)) erros.Add("bairro é obrigatório.");
        else if (!await db.LugarExiste(novo.Bairro, cancelamento)) erros.Add(ErroBairro(novo.Bairro));

        var agora = DateTimeOffset.UtcNow;
        if (novo.OcorridoEm is null)
            erros.Add("ocorrido_em é obrigatório (ex.: 2026-11-10T21:35:00-03:00).");
        else if (novo.OcorridoEm > agora.AddMinutes(Regiao.MinutosFolgaFuturo))
            erros.Add("ocorrido_em não pode estar no futuro.");
        else if (novo.OcorridoEm < agora.AddDays(-Regiao.DiasMaximosAtras))
            erros.Add($"ocorrido_em precisa estar nos últimos {Regiao.DiasMaximosAtras} dias.");

        if (string.IsNullOrWhiteSpace(novo.Origem)) erros.Add("origem é obrigatória.");
        else if (!CodigoEnumConverter<OrigemRelato>.TentarLer(novo.Origem, out _)) erros.Add(ErroOrigem);

        return erros;
    }
}
