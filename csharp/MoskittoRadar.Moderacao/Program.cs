using MoskittoRadar.Moderacao.Forms;
using MoskittoRadar.Moderacao.Services;

namespace MoskittoRadar.Moderacao;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();

        using var entrada = new FormEntrada();
        if (entrada.ShowDialog() != DialogResult.OK || entrada.Usuario == null) return;

        var repositorio = new RepositorioRelatos();
        DadosSimulados.Carregar(repositorio);
        Application.Run(new FormPrincipal(repositorio, entrada.Usuario));
    }
}
