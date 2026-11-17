using Avalonia;
using Avalonia.Controls;
using Avalonia.Layout;
using Avalonia.Media;
using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Linux;

/// <summary>Equivale ao FormNovoRelato. As regras continuam nos construtores das classes do João.</summary>
public class JanelaNovoRelato : Window
{
    private readonly ComboBox cmbTipo = new() { ItemsSource = new[] { "Celular", "Veículo", "Bicicleta" }, SelectedIndex = 0, Width = 220 };
    private readonly TextBox txtBairro = new() { Text = "Bela Vista", Width = 220 };
    private readonly NumericUpDown numLatitude = CampoCoordenada(-23.561m);
    private readonly NumericUpDown numLongitude = CampoCoordenada(-46.656m);
    private readonly DatePicker dtpDia = new() { SelectedDate = DateTimeOffset.Now };
    private readonly TimePicker tmpHora = new() { SelectedTime = DateTime.Now.TimeOfDay, ClockIdentifier = "24HourClock" };
    private readonly TextBox txtDescricao = new() { Width = 300, Height = 70, AcceptsReturn = true, TextWrapping = TextWrapping.Wrap, MaxLength = 400 };
    private readonly CheckBox chkExtra = new();

    public JanelaNovoRelato()
    {
        Title = "Novo relato";
        Icon = App.Icone;
        SizeToContent = SizeToContent.WidthAndHeight;
        CanResize = false;
        WindowStartupLocation = WindowStartupLocation.CenterOwner;

        cmbTipo.SelectionChanged += (_, _) => chkExtra.Content = TextoExtra();
        chkExtra.Content = TextoExtra();

        var btnSalvar = new Button { Content = "Salvar", IsDefault = true, HorizontalAlignment = HorizontalAlignment.Right };
        btnSalvar.Click += async (_, _) => await Salvar();

        var campos = new Grid { ColumnDefinitions = new ColumnDefinitions("Auto,*"), ColumnSpacing = 12, RowSpacing = 10 };
        var linha = 0;
        foreach (var (rotulo, campo) in new (string, Control)[]
        {
            ("Tipo", cmbTipo), ("Bairro", txtBairro), ("Latitude", numLatitude), ("Longitude", numLongitude),
            ("Dia", dtpDia), ("Hora", tmpHora), ("Descrição", txtDescricao), ("", chkExtra),
        })
        {
            campos.RowDefinitions.Add(new RowDefinition(GridLength.Auto));
            var texto = new TextBlock { Text = rotulo, VerticalAlignment = VerticalAlignment.Center };
            Grid.SetRow(texto, linha);
            Grid.SetRow(campo, linha);
            Grid.SetColumn(campo, 1);
            campos.Children.Add(texto);
            campos.Children.Add(campo);
            linha++;
        }

        Content = new StackPanel { Margin = new Thickness(20), Spacing = 16, Children = { campos, btnSalvar } };
    }

    private static NumericUpDown CampoCoordenada(decimal valor) =>
        new() { Width = 220, FormatString = "0.000", Increment = 0.001m, Minimum = -90, Maximum = 90, Value = valor };

    private string TextoExtra() => cmbTipo.SelectedIndex switch
    {
        0 => "Foi no transporte público (ônibus, metrô, ponto)",
        1 => "Era uma moto",
        _ => "Bicicleta compartilhada (de aluguel)",
    };

    private async Task Salvar()
    {
        var latitude = (double)(numLatitude.Value ?? 0);
        var longitude = (double)(numLongitude.Value ?? 0);
        var quando = (dtpDia.SelectedDate?.Date ?? DateTime.Today) + (tmpHora.SelectedTime ?? TimeSpan.Zero);
        var descricao = txtDescricao.Text ?? "";
        var bairro = txtBairro.Text ?? "";
        var extra = chkExtra.IsChecked == true;
        try
        {
            Relato relato = cmbTipo.SelectedIndex switch
            {
                0 => new RouboCelular(latitude, longitude, bairro, quando, descricao, extra),
                1 => new RouboVeiculo(latitude, longitude, bairro, quando, descricao, extra),
                _ => new RouboBicicleta(latitude, longitude, bairro, quando, descricao, extra),
            };
            Close(relato);
        }
        catch (ArgumentException erro)
        {
            await Dialogos.Aviso(this, "Relato inválido", erro.Message);
        }
    }
}
