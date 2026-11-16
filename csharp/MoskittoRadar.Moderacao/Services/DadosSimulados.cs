using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Services;

/// <summary>
/// Relatos de exemplo para a demonstração. São SIMULADOS: nenhum dado real de pessoa.
/// Ficam perto das estações Consolação, Trianon-Masp e Brigadeiro, onde o projeto começou.
/// </summary>
public static class DadosSimulados
{
    public static void Carregar(RepositorioRelatos repositorio)
    {
        var hoje = DateTime.Today;

        repositorio.Adicionar(new RouboCelular(-23.558, -46.661, "Consolação", hoje.AddHours(-3), "Levaram meu celular no ponto de ônibus", true));
        repositorio.Adicionar(new RouboCelular(-23.561, -46.656, "Bela Vista", hoje.AddDays(-1).AddHours(21), "Celular arrancado da mão na calçada", false));
        repositorio.Adicionar(new RouboCelular(-23.567, -46.650, "Bela Vista", hoje.AddDays(-1).AddHours(8), "Dentro do metrô, saída Brigadeiro", true));
        repositorio.Adicionar(new RouboCelular(-23.565, -46.664, "Cerqueira César", hoje.AddDays(-2).AddHours(19), "", false));
        repositorio.Adicionar(new RouboCelular(-23.545, -46.639, "Sé", hoje.AddDays(-2).AddHours(13), "Abordagem na praça", false));
        repositorio.Adicionar(new RouboVeiculo(-23.562, -46.669, "Cerqueira César", hoje.AddDays(-1).AddHours(2), "Moto levada no semáforo", true));
        repositorio.Adicionar(new RouboVeiculo(-23.556, -46.662, "Consolação", hoje.AddDays(-3).AddHours(22), "Carro levado na saída do estacionamento", false));
        repositorio.Adicionar(new RouboVeiculo(-23.651, -46.532, "Santo André", hoje.AddDays(-4).AddHours(15), "", false));
        repositorio.Adicionar(new RouboBicicleta(-23.563, -46.654, "Bela Vista", hoje.AddDays(-1).AddHours(17), "Bicicleta de aluguel na ciclovia da Paulista", true));
        repositorio.Adicionar(new RouboBicicleta(-23.559, -46.665, "Consolação", hoje.AddDays(-2).AddHours(4), "Bicicleta própria presa no poste", false));
        repositorio.Adicionar(new RouboBicicleta(-23.587, -46.682, "Pinheiros", hoje.AddDays(-5).AddHours(11), "", false));

        // Alguns já moderados, para a lista não começar toda pendente.
        var moderador = new Moderador("Equipe");
        var aprovados = repositorio.Filtrar("Todos", null, "Cerqueira César");
        moderador.Aprovar(aprovados[0]);
        moderador.Rejeitar(repositorio.Filtrar("Bicicleta", null, "Pinheiros")[0], "Relato duplicado");
    }
}
