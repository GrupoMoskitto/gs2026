using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Themes.Fluent;

namespace MoskittoRadar.Moderacao.Linux;

public class App : Application
{
    public override void Initialize() => Styles.Add(new FluentTheme());

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            var entrada = new JanelaEntrada();
            entrada.Entrou += usuario =>
            {
                var principal = new JanelaPrincipal(new ClienteApi(), usuario);
                desktop.MainWindow = principal;
                principal.Show();
                entrada.Close();
            };
            desktop.MainWindow = entrada;
        }
        base.OnFrameworkInitializationCompleted();
    }
}
