using System.Reflection;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace MoskittoRadar.Api.Data;

/// <summary>
/// Guarda o enum no banco como o mesmo código do JSON (ex.: TipoRelato.BolsaMochila → "bolsa_mochila").
/// Assim o banco fica legível e igual ao formato comum do projeto.
/// </summary>
public class CodigoEnumConverter<T>() : ValueConverter<T, string>(
    valor => ParaCodigo(valor),
    codigo => DeCodigo(codigo))
    where T : struct, Enum
{
    private static readonly Dictionary<T, string> Codigos = Enum.GetValues<T>().ToDictionary(
        valor => valor,
        valor => typeof(T).GetField(valor.ToString())!
            .GetCustomAttribute<JsonStringEnumMemberNameAttribute>()?.Name ?? valor.ToString().ToLowerInvariant());

    private static readonly Dictionary<string, T> Valores = Codigos.ToDictionary(par => par.Value, par => par.Key);

    public static string ParaCodigo(T valor) => Codigos[valor];

    public static T DeCodigo(string codigo) => Valores[codigo];

    /// <summary>Tenta ler um código vindo de fora (query string, CSV). Não aceita número nem nome em C#.</summary>
    public static bool TentarLer(string? codigo, out T valor) => Valores.TryGetValue(codigo ?? "", out valor);
}

/// <summary>
/// O SQLite não tem tipo de data. Por padrão o EF Core grava DateTimeOffset como texto e
/// não consegue fazer ORDER BY nem comparar (&lt;, &gt;) essas colunas: a consulta falha.
///
/// Este conversor grava um número inteiro: os ticks em UTC (divididos por 1000) nos bits altos
/// e o fuso em minutos nos 11 bits baixos. Ordenar o número é o mesmo que ordenar o instante em UTC,
/// e o fuso original (ex.: -03:00) volta intacto na leitura.
/// </summary>
public class DataUtcConverter() : ValueConverter<DateTimeOffset, long>(
    data => ParaNumero(data),
    numero => DeNumero(numero))
{
    public static long ParaNumero(DateTimeOffset data) =>
        ((data.UtcTicks / 1000) << 11) | ((long)data.Offset.TotalMinutes & 0x07FF);

    public static DateTimeOffset DeNumero(long numero)
    {
        var utc = new DateTimeOffset((numero >> 11) * 1000, TimeSpan.Zero);
        var minutosFuso = (int)((numero << 53) >> 53); // recupera o sinal dos 11 bits
        return utc.ToOffset(TimeSpan.FromMinutes(minutosFuso));
    }
}
