using System.Text.Json.Serialization;

namespace MoskittoRadar.Api.Models;

// Os valores seguem o formato comum do projeto (AGENTS.md, seção 4).
// O nome em C# é PascalCase; o código que vai no JSON e no banco é o do atributo.

/// <summary>Tipo de roubo relatado.</summary>
public enum TipoRelato
{
    [JsonStringEnumMemberName("celular")] Celular,
    [JsonStringEnumMemberName("bolsa_mochila")] BolsaMochila,
    [JsonStringEnumMemberName("veiculo")] Veiculo,
    [JsonStringEnumMemberName("bicicleta")] Bicicleta,
    [JsonStringEnumMemberName("comercio")] Comercio,
    [JsonStringEnumMemberName("outro")] Outro,
}

/// <summary>Situação do relato na moderação. Todo relato novo começa como pendente.</summary>
public enum StatusRelato
{
    [JsonStringEnumMemberName("pendente")] Pendente,
    [JsonStringEnumMemberName("aprovado")] Aprovado,
    [JsonStringEnumMemberName("rejeitado")] Rejeitado,
}

/// <summary>Canal que enviou o relato.</summary>
public enum OrigemRelato
{
    [JsonStringEnumMemberName("mobile")] Mobile,
    [JsonStringEnumMemberName("desktop")] Desktop,
    [JsonStringEnumMemberName("iot")] Iot,
}

/// <summary>Faixa do dia usada pelo modelo de ML.</summary>
public enum FaixaHoraria
{
    /// <summary>0h às 6h.</summary>
    [JsonStringEnumMemberName("madrugada")] Madrugada,
    /// <summary>6h às 12h.</summary>
    [JsonStringEnumMemberName("manha")] Manha,
    /// <summary>12h às 18h.</summary>
    [JsonStringEnumMemberName("tarde")] Tarde,
    /// <summary>18h às 24h.</summary>
    [JsonStringEnumMemberName("noite")] Noite,
}

/// <summary>Nível de risco previsto pelo modelo de ML.</summary>
public enum NivelRisco
{
    [JsonStringEnumMemberName("baixo")] Baixo,
    [JsonStringEnumMemberName("medio")] Medio,
    [JsonStringEnumMemberName("alto")] Alto,
}

/// <summary>Tipo de lugar na lista de 129 lugares (ia/data/lugares.csv).</summary>
public enum TipoLugar
{
    [JsonStringEnumMemberName("bairro")] Bairro,
    [JsonStringEnumMemberName("distrito")] Distrito,
    [JsonStringEnumMemberName("municipio")] Municipio,
}
