using MoskittoRadar.Moderacao.Forms;
using MoskittoRadar.Moderacao.Services;

namespace MoskittoRadar.Moderacao;

internal static class Program
{
    /// <summary>Ícone do Moskitto (moskitto.ico, gravado no .exe pelo csproj) para todas as janelas.</summary>
    internal static readonly Icon? Icone = Icon.ExtractAssociatedIcon(Application.ExecutablePath);

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
