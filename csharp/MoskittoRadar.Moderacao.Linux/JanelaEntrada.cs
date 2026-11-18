using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Linux;

/// <summary>Equivale ao FormEntrada: apelido e papel. O moderador entra com a chave, conferida na API.</summary>
public class JanelaEntrada : Window
{
    private readonly TextBox txtApelido = new();
    private readonly RadioButton rbModerador = new() { Content = "Moderador", GroupName = "papel", IsChecked = true };
    private readonly RadioButton rbCidadao = new() { Content = "Cidadão", GroupName = "papel" };
    private readonly TextBox txtChave = new() { PasswordChar = '•' };
    private readonly ClienteApi api;

    public event Action<Usuario>? Entrou;

    public JanelaEntrada(ClienteApi api)
    {
        this.api = api;
        Title = "Moskitto Radar · Entrar";
        Icon = App.Icone;
        Width = 340;
        SizeToContent = SizeToContent.Height;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;

        var btnEntrar = new Button { Content = "Entrar", IsDefault = true, HorizontalAlignment = HorizontalAlignment.Right };
        btnEntrar.Click += async (_, _) => await Entrar();

        // O moderador é identificado pela chave; o apelido vem da API. O cidadão só digita o apelido.
        var lblApelido = new TextBlock { Text = "Apelido (sem nome real):" };
        var lblChave = new TextBlock { Text = "Chave de moderador:" };
        void TrocarPapel()
        {
            var moderador = rbModerador.IsChecked == true;
            lblApelido.IsVisible = txtApelido.IsVisible = !moderador;
            lblChave.IsVisible = txtChave.IsVisible = moderador;
        }
        rbModerador.IsCheckedChanged += (_, _) => TrocarPapel();
        TrocarPapel();

        Content = new StackPanel
        {
            Margin = new Thickness(20), Spacing = 10,
            Children =
            {
                new StackPanel { Orientation = Orientation.Horizontal, Spacing = 16, Children = { rbModerador, rbCidadao } },
                lblApelido,
                txtApelido,
                lblChave,
                txtChave,
                btnEntrar,
            },
        };
    }

    private async Task Entrar()
    {
        try
        {
            Usuario usuario = rbModerador.IsChecked == true
                ? new Moderador(await api.Entrar(txtChave.Text ?? ""))
                : new Cidadao(txtApelido.Text ?? "");
            Entrou?.Invoke(usuario);
        }
        catch (ArgumentException erro)
        {
            await Dialogos.Aviso(this, "Apelido inválido", erro.Message);
        }
        catch (Exception erro) when (erro is HttpRequestException or InvalidOperationException or TaskCanceledException)
        {
            await Dialogos.Aviso(this, "Não foi possível entrar", erro is InvalidOperationException ? erro.Message : $"A API não respondeu em {api.Endereco}.");
        }
    }
}
