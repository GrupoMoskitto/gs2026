using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using MoskittoRadar.Api.Models;

namespace MoskittoRadar.Api.Seguranca;

/// <summary>
/// Moderadores e o hash SHA-256 da chave de cada um, lidos da configuração: "Moderadores": { "apelido": "hash" }.
/// A chave em si não fica guardada em lugar nenhum. No servidor, cada moderador entra por variável de ambiente
/// (Moderadores__apelido = hash); em desenvolvimento, pelo appsettings.Development.json.
/// </summary>
public class Moderadores(IConfiguration configuracao)
{
    /// <summary>Devolve o apelido do dono da chave, ou null se a chave não for de nenhum moderador.</summary>
    public string? Identificar(string? chave)
    {
        if (string.IsNullOrEmpty(chave)) return null;
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(chave));

        string? apelido = null;
        // Confere todos os moderadores, sem parar no primeiro, e compara em tempo constante:
        // assim o tempo de resposta não dá pista de quão perto a chave chegou.
        foreach (var moderador in configuracao.GetSection("Moderadores").GetChildren())
        {
            if (LerHex(moderador.Value) is { } esperado && CryptographicOperations.FixedTimeEquals(hash, esperado))
                apelido = moderador.Key;
        }
        return apelido;
    }

    /// <summary>Hash que vai na configuração para uma chave nova.</summary>
    public static string Hash(string chave) => Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(chave)));

    private static byte[]? LerHex(string? texto)
    {
        try { return texto is { Length: 64 } ? Convert.FromHexString(texto) : null; }
        catch (FormatException) { return null; }
    }
}

/// <summary>
/// Só deixa a requisição seguir se vier "Authorization: Bearer chave" de um moderador. Senão, responde 401.
/// O apelido do moderador fica em HttpContext.Items para o controller registrar quem decidiu.
/// </summary>
public class ExigeModeradorAttribute : Attribute, IAuthorizationFilter
{
    public const string ItemApelido = "moderador";

    public void OnAuthorization(AuthorizationFilterContext contexto)
    {
        var http = contexto.HttpContext;
        var cabecalho = http.Request.Headers.Authorization.ToString();
        var chave = cabecalho.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase) ? cabecalho[7..].Trim() : null;
        var apelido = http.RequestServices.GetRequiredService<Moderadores>().Identificar(chave);

        if (apelido is null)
        {
            // Vai para o log do servidor: várias recusas seguidas indicam alguém tentando adivinhar chaves.
            http.RequestServices.GetRequiredService<ILogger<ExigeModeradorAttribute>>().LogWarning(
                "Moderação recusada: chave {Situacao} em {Metodo} {Caminho}, IP {Ip}",
                string.IsNullOrEmpty(chave) ? "ausente" : "inválida", http.Request.Method, http.Request.Path, http.Connection.RemoteIpAddress);
            http.Response.Headers.WWWAuthenticate = "Bearer";
            contexto.Result = new UnauthorizedObjectResult(
                new RespostaErro("Só moderadores podem fazer isso. Envie a chave no cabeçalho Authorization: Bearer <chave>."));
            return;
        }

        http.Items[ItemApelido] = apelido;
    }
}
