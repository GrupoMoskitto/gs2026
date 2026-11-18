using System.Globalization;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace MoskittoRadar.Moderacao.Linux;

/// <summary>Relato no formato comum da API (AGENTS.md, seção 4).</summary>
public record RelatoApi(
    string Id, string Tipo, string? Descricao, double Latitude, double Longitude,
    string Bairro, DateTimeOffset OcorridoEm, string Status, string Origem);

/// <summary>Fala com a API do João (soa/). O endereço vem de MODERACAO_API, ou localhost:5207.</summary>
public class ClienteApi
{
    private static readonly JsonSerializerOptions Json = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

    private readonly HttpClient http = new()
    {
        BaseAddress = new Uri(Environment.GetEnvironmentVariable("MODERACAO_API") ?? "http://localhost:5207"),
        Timeout = TimeSpan.FromSeconds(10),
    };

    public string Endereco => http.BaseAddress!.ToString();

    /// <summary>
    /// Confere a chave do moderador na API e devolve o apelido dono dela. Daí em diante, toda requisição
    /// leva a chave no cabeçalho Authorization, que a API exige para aprovar e rejeitar.
    /// </summary>
    public async Task<string> Entrar(string chave)
    {
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", chave.Trim());
        using var resposta = await http.GetAsync("/api/moderadores/eu");
        if (resposta.StatusCode == HttpStatusCode.Unauthorized)
        {
            http.DefaultRequestHeaders.Authorization = null;
            throw new InvalidOperationException("Chave de moderador inválida.");
        }
        await Conferir(resposta);
        var dono = await resposta.Content.ReadFromJsonAsync<Dictionary<string, string>>(Json);
        return dono!["apelido"];
    }

    public async Task<List<RelatoApi>> Listar(string? status, string? tipo)
    {
        var filtros = new List<string> { "limite=1000" };
        if (status != null) filtros.Add($"status={status}");
        if (tipo != null) filtros.Add($"tipo={tipo}");
        return await http.GetFromJsonAsync<List<RelatoApi>>($"/api/relatos?{string.Join('&', filtros)}", Json) ?? [];
    }

    public async Task<int> Contar(string status)
    {
        using var resposta = await http.GetAsync($"/api/relatos?status={status}&limite=1");
        resposta.EnsureSuccessStatusCode();
        return int.Parse(resposta.Headers.GetValues("X-Total-Count").First(), CultureInfo.InvariantCulture);
    }

    public async Task MudarStatus(string id, string status, string? motivo) =>
        await Conferir(await http.PatchAsJsonAsync($"/api/relatos/{id}/status", new { status, motivo }, Json));

    public async Task Criar(object relato) =>
        await Conferir(await http.PostAsJsonAsync("/api/relatos", relato, Json));

    private static async Task Conferir(HttpResponseMessage resposta)
    {
        if (resposta.IsSuccessStatusCode) return;
        var erro = await resposta.Content.ReadFromJsonAsync<Dictionary<string, string>>();
        throw new InvalidOperationException(erro?.GetValueOrDefault("erro") ?? $"A API respondeu {(int)resposta.StatusCode}.");
    }
}

/// <summary>Os 129 lugares (ia/data/lugares.csv): código da API ↔ nome para mostrar.</summary>
public static class Lugares
{
    private static readonly Dictionary<string, string> NomePorCodigo = Carregar();

    public static string Nome(string codigo) => NomePorCodigo.GetValueOrDefault(codigo, codigo);

    public static string? Codigo(string nome) =>
        NomePorCodigo.FirstOrDefault(par => string.Equals(par.Value, nome.Trim(), StringComparison.OrdinalIgnoreCase)).Key;

    private static Dictionary<string, string> Carregar()
    {
        var arquivo = Path.Combine(AppContext.BaseDirectory, "lugares.csv");
        return File.ReadLines(arquivo).Skip(1)
            .Select(linha => linha.Split(','))
            .ToDictionary(colunas => colunas[0], colunas => colunas[1]);
    }
}
