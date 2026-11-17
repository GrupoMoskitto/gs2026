using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Linux;

/// <summary>Equivale ao FormEntrada: apelido e papel.</summary>
public class JanelaEntrada : Window
{
    private readonly TextBox txtApelido = new();
    private readonly RadioButton rbModerador = new() { Content = "Moderador", GroupName = "papel", IsChecked = true };
    private readonly RadioButton rbCidadao = new() { Content = "Cidadão", GroupName = "papel" };

    public event Action<Usuario>? Entrou;

    public JanelaEntrada()
    {
        Title = "Moskitto Radar · Entrar";
        Width = 340;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;

        var btnEntrar = new Button { Content = "Entrar", IsDefault = true, HorizontalAlignment = HorizontalAlignment.Right };
        btnEntrar.Click += async (_, _) => await Entrar();

        Content = new StackPanel
        {
            Margin = new Thickness(20), Spacing = 10,
            Children =
            {
                new TextBlock { Text = "Apelido (sem nome real):" },
                txtApelido,
                new StackPanel { Orientation = Orientation.Horizontal, Spacing = 16, Children = { rbModerador, rbCidadao } },
                btnEntrar,
            },
        };
    }

    private async Task Entrar()
    {
        try
        {
            Usuario usuario = rbModerador.IsChecked == true ? new Moderador(txtApelido.Text ?? "") : new Cidadao(txtApelido.Text ?? "");
            Entrou?.Invoke(usuario);
        }
        catch (ArgumentException erro)
        {
            await Dialogos.Aviso(this, "Apelido inválido", erro.Message);
        }
    }
}
