using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Themes.Fluent;

namespace MoskittoRadar.Moderacao.Linux;

public class App : Application
{
    public static readonly WindowIcon Icone = new(Path.Combine(AppContext.BaseDirectory, "moskitto.ico"));

    public override void Initialize() => Styles.Add(new FluentTheme());

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var api = new ClienteApi();
            var entrada = new JanelaEntrada(api);
            entrada.Entrou += usuario =>
            {
                var principal = new JanelaPrincipal(api, usuario);
                desktop.MainWindow = principal;
                principal.Show();
                entrada.Close();
            };
            desktop.MainWindow = entrada;
        }
        base.OnFrameworkInitializationCompleted();
    }
}
