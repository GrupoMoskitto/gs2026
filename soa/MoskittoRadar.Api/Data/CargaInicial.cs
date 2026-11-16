using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Models;

namespace MoskittoRadar.Api.Data;

/// <summary>
/// Carrega os dados do Coto na primeira execução: os 129 lugares, os 10.000 relatos simulados
/// e as 516 previsões do ML. Cada tabela só é carregada se estiver vazia, então rodar de novo não duplica nada.
/// Os arquivos ficam em Dados/ (cópia de ia/data) e vão junto no publish para o IIS.
/// </summary>
public static class CargaInicial
{
    private static readonly CultureInfo Invariante = CultureInfo.InvariantCulture;

    private static readonly JsonSerializerOptions OpcoesJson = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        Converters = { new JsonStringEnumConverter() },
    };

    public static void Executar(AppDbContext db, string pastaDados, ILogger logger)
    {
        using var transacao = db.Database.BeginTransaction();

        if (!db.Lugares.Any())
        {
            var lugares = LerLugares(Path.Combine(pastaDados, "lugares.csv"));
            db.Lugares.AddRange(lugares);
            db.SaveChanges();
            logger.LogInformation("Carga inicial: {Quantidade} lugares", lugares.Count);
        }

        if (!db.Relatos.Any())
        {
            var relatos = LerRelatos(Path.Combine(pastaDados, "relatos_simulados.csv"));
            db.Relatos.AddRange(relatos);
            db.SaveChanges();
            logger.LogInformation("Carga inicial: {Quantidade} relatos simulados", relatos.Count);
        }

        if (!db.Previsoes.Any())
        {
            var previsoes = LerPrevisoes(Path.Combine(pastaDados, "previsoes.json"));
            db.Previsoes.AddRange(previsoes);
            db.SaveChanges();
            logger.LogInformation("Carga inicial: {Quantidade} previsões de risco", previsoes.Count);
        }

        transacao.Commit();
        db.ChangeTracker.Clear();
    }

    private static List<Lugar> LerLugares(string arquivo) =>
        LerCsv(arquivo).Select(linha => new Lugar
        {
            Codigo = linha["codigo"],
            Nome = linha["nome"],
            Tipo = LerEnum<TipoLugar>(linha["tipo"], arquivo),
            Latitude = double.Parse(linha["latitude"], Invariante),
            Longitude = double.Parse(linha["longitude"], Invariante),
            CodIbge = linha["cod_ibge"],
        }).ToList();

    private static List<Relato> LerRelatos(string arquivo) =>
        LerCsv(arquivo).Select(linha =>
        {
            var ocorridoEm = DateTimeOffset.Parse(linha["ocorrido_em"], Invariante);
            return new Relato
            {
                Id = Guid.Parse(linha["id"]),
                Tipo = LerEnum<TipoRelato>(linha["tipo"], arquivo),
                Descricao = string.IsNullOrWhiteSpace(linha["descricao"]) ? null : linha["descricao"],
                Latitude = Relato.ArredondarCoordenada(double.Parse(linha["latitude"], Invariante)),
                Longitude = Relato.ArredondarCoordenada(double.Parse(linha["longitude"], Invariante)),
                Bairro = linha["bairro"],
                OcorridoEm = ocorridoEm,
                CriadoEm = ocorridoEm, // relato simulado: considera que foi enviado na hora
                Status = LerEnum<StatusRelato>(linha["status"], arquivo),
                Origem = LerEnum<OrigemRelato>(linha["origem"], arquivo),
            };
        }).ToList();

    private static List<PrevisaoRisco> LerPrevisoes(string arquivo)
    {
        var linhas = JsonSerializer.Deserialize<List<PrevisaoJson>>(File.ReadAllText(arquivo), OpcoesJson)
            ?? throw new InvalidDataException($"{arquivo} está vazio.");
        return linhas.Select(p => new PrevisaoRisco
        {
            Bairro = p.Bairro,
            FaixaHoraria = p.FaixaHoraria,
            NivelRisco = p.NivelRisco,
            Score = p.Score,
        }).ToList();
    }

    /// <summary>Formato de cada linha de previsoes.json.</summary>
    private sealed record PrevisaoJson(string Bairro, FaixaHoraria FaixaHoraria, NivelRisco NivelRisco, double Score);

    private static T LerEnum<T>(string codigo, string arquivo) where T : struct, Enum =>
        CodigoEnumConverter<T>.TentarLer(codigo, out var valor)
            ? valor
            : throw new InvalidDataException($"{Path.GetFileName(arquivo)}: valor \"{codigo}\" inválido para {typeof(T).Name}.");

    /// <summary>
    /// Lê um CSV com cabeçalho e devolve cada linha como dicionário (coluna → valor).
    /// Aceita campos entre aspas com vírgula dentro (ex.: "Abordagem na esquina, levaram o celular").
    /// </summary>
    private static IEnumerable<Dictionary<string, string>> LerCsv(string arquivo)
    {
        using var leitor = new StreamReader(arquivo, Encoding.UTF8);
        var cabecalho = SepararCampos(leitor.ReadLine() ?? throw new InvalidDataException($"{arquivo} está vazio."));
        string? texto;
        var numero = 1;
        while ((texto = leitor.ReadLine()) is not null)
        {
            numero++;
            if (texto.Length == 0) continue;
            var campos = SepararCampos(texto);
            if (campos.Count != cabecalho.Count)
                throw new InvalidDataException($"{Path.GetFileName(arquivo)}, linha {numero}: esperava {cabecalho.Count} colunas e veio {campos.Count}.");
            yield return cabecalho.Zip(campos).ToDictionary(par => par.First, par => par.Second);
        }
    }

    private static List<string> SepararCampos(string linha)
    {
        var campos = new List<string>();
        var atual = new StringBuilder();
        var entreAspas = false;
        for (var i = 0; i < linha.Length; i++)
        {
            var c = linha[i];
            if (entreAspas)
            {
                if (c == '"' && i + 1 < linha.Length && linha[i + 1] == '"') { atual.Append('"'); i++; }
                else if (c == '"') entreAspas = false;
                else atual.Append(c);
            }
            else if (c == '"') entreAspas = true;
            else if (c == ',') { campos.Add(atual.ToString()); atual.Clear(); }
            else atual.Append(c);
        }
        campos.Add(atual.ToString());
        return campos;
    }
}
