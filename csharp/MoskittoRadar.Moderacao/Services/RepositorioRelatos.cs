using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Services;

/// <summary>Guarda os relatos em memória (lista). Ao fechar o programa, tudo volta aos dados simulados.</summary>
public class RepositorioRelatos
{
    private readonly List<Relato> relatos = new List<Relato>();

    public void Adicionar(Relato relato)
    {
        relatos.Add(relato);
    }

    /// <summary>
    /// Relatos que passam nos filtros, do mais prioritário para o menos.
    /// tipo "Todos", status null e bairro vazio significam "sem filtro".
    /// </summary>
    public List<Relato> Filtrar(string tipo, StatusRelato? status, string bairro)
    {
        var resultado = new List<Relato>();
        foreach (var relato in relatos)
        {
            if (tipo != "Todos" && relato.Tipo != tipo) continue;
            if (status != null && relato.Status != status) continue;
            if (bairro.Trim() != "" && !relato.Bairro.Contains(bairro.Trim(), StringComparison.OrdinalIgnoreCase)) continue;
            resultado.Add(relato);
        }
        resultado.Sort((a, b) => b.CalcularPrioridade().CompareTo(a.CalcularPrioridade()));
        return resultado;
    }

    public int Contar(StatusRelato status)
    {
        var total = 0;
        foreach (var relato in relatos)
            if (relato.Status == status) total++;
        return total;
    }
}
