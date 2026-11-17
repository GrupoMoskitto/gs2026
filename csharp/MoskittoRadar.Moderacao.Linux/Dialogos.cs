using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;

namespace MoskittoRadar.Moderacao.Linux;

/// <summary>O que o Windows Forms dá pronto (MessageBox e a caixa do motivo), feito à mão.</summary>
public static class Dialogos
{
    public static Task Aviso(Window dono, string titulo, string mensagem)
    {
        var janela = Caixa(titulo);
        var ok = new Button { Content = "OK", IsDefault = true, HorizontalAlignment = HorizontalAlignment.Right };
        ok.Click += (_, _) => janela.Close();
        janela.Content = new StackPanel
        {
            Margin = new Thickness(16), Spacing = 14,
            Children = { new TextBlock { Text = mensagem, TextWrapping = TextWrapping.Wrap }, ok },
        };
        return janela.ShowDialog(dono);
    }

    public static Task<string?> PedirTexto(Window dono, string titulo, string inicial, string botao)
    {
        var janela = Caixa(titulo);
        var texto = new TextBox { Text = inicial };
        var confirmar = new Button { Content = botao, IsDefault = true };
        var cancelar = new Button { Content = "Cancelar", IsCancel = true };
        confirmar.Click += (_, _) => janela.Close(texto.Text ?? "");
        cancelar.Click += (_, _) => janela.Close(null);
        janela.Content = new StackPanel
        {
            Margin = new Thickness(16), Spacing = 14,
            Children =
            {
                texto,
                new StackPanel { Orientation = Orientation.Horizontal, Spacing = 8, HorizontalAlignment = HorizontalAlignment.Right, Children = { cancelar, confirmar } },
            },
        };
        return janela.ShowDialog<string?>(dono);
    }

    private static Window Caixa(string titulo) => new()
    {
        Title = titulo, Width = 380, SizeToContent = SizeToContent.Height, CanResize = false,
        WindowStartupLocation = WindowStartupLocation.CenterOwner,
    };
}
