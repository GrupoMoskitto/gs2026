using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Templates;
using Avalonia.Layout;
using Avalonia.Media;
using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Linux;

/// <summary>Um relato da API e, quando o tipo existe no app do João, a classe dele (prioridade e descrição).</summary>
public record LinhaRelato(RelatoApi Api, Relato? Joao)
{
    public string Prioridade => Joao?.CalcularPrioridade().ToString() ?? "–";
}

/// <summary>Equivale ao FormPrincipal, mas lendo e moderando os relatos da API do João.</summary>
public class JanelaPrincipal : Window
{
    private const string Colunas = "90,110,*,110,100,80";

    private static readonly (string Codigo, string Nome)[] Tipos =
    [
        ("celular", "Celular"), ("bolsa_mochila", "Bolsa/mochila"), ("veiculo", "Veículo"),
        ("bicicleta", "Bicicleta"), ("comercio", "Comércio"), ("outro", "Outro"),
    ];
    private static readonly string[] StatusApi = ["pendente", "aprovado", "rejeitado"];

    private readonly ClienteApi api;
    private readonly Usuario usuario;
    private int consulta;

    private readonly ComboBox cmbTipo = new() { ItemsSource = new[] { "Todos" }.Concat(Tipos.Select(t => t.Nome)).ToArray(), SelectedIndex = 0, Width = 140 };
    private readonly ComboBox cmbStatus = new() { ItemsSource = new[] { "Todos", "Pendente", "Aprovado", "Rejeitado" }, SelectedIndex = 1, Width = 120 };
    private readonly TextBox txtBairro = new() { Width = 160 };
    private readonly ListBox lista = new();
    private readonly TextBox txtDetalhe = new() { IsReadOnly = true, AcceptsReturn = true, TextWrapping = TextWrapping.Wrap };
    private readonly Button btnAprovar = new() { Content = "Aprovar" };
    private readonly Button btnRejeitar = new() { Content = "Rejeitar" };
    private readonly TextBlock lblResumo = new() { Margin = new Thickness(12, 6) };

    public JanelaPrincipal(ClienteApi api, Usuario usuario)
    {
        this.api = api;
        this.usuario = usuario;

        Title = $"Moskitto Radar · Moderação de relatos · {usuario}";
        Width = 1080;
        Height = 620;
        WindowStartupLocation = WindowStartupLocation.CenterScreen;

        cmbTipo.SelectionChanged += async (_, _) => await AtualizarLista();
        cmbStatus.SelectionChanged += async (_, _) => await AtualizarLista();
        txtBairro.TextChanged += async (_, _) => await AtualizarLista();
        lista.SelectionChanged += (_, _) => MostrarDetalhe();
        lista.ItemTemplate = new FuncDataTemplate<LinhaRelato?>((linha, _) => linha is null ? new Grid() : Linha(
            linha.Api.OcorridoEm.ToString("dd/MM HH:mm"), NomeTipo(linha.Api.Tipo), Lugares.Nome(linha.Api.Bairro),
            Maiuscula(linha.Api.Status), Maiuscula(linha.Api.Origem), linha.Prioridade));

        var btnNovo = new Button { Content = "Novo relato" };
        var btnRecarregar = new Button { Content = "Recarregar" };
        btnNovo.Click += async (_, _) => await NovoRelato();
        btnRecarregar.Click += async (_, _) => await AtualizarLista();
        btnAprovar.Click += async (_, _) => await Moderar(aprovar: true);
        btnRejeitar.Click += async (_, _) => await Moderar(aprovar: false);

        var filtros = new WrapPanel
        {
            Margin = new Thickness(12, 10),
            Children =
            {
                Rotulo("Tipo"), cmbTipo, Rotulo("Status"), cmbStatus, Rotulo("Bairro"), txtBairro,
                new Border { Width = 12 }, btnNovo, new Border { Width = 8 }, btnRecarregar,
            },
        };

        var cabecalho = Linha("Quando", "Tipo", "Lugar", "Status", "Origem", "Prioridade");
        cabecalho.Margin = new Thickness(12, 0, 12, 4);
        foreach (var texto in cabecalho.Children.OfType<TextBlock>()) texto.FontWeight = FontWeight.SemiBold;

        var esquerda = new DockPanel { Children = { cabecalho, lista } };
        DockPanel.SetDock(cabecalho, Dock.Top);

        var botoes = new StackPanel
        {
            Orientation = Orientation.Horizontal, Spacing = 8, HorizontalAlignment = HorizontalAlignment.Right,
            Margin = new Thickness(0, 8, 0, 0), Children = { btnAprovar, btnRejeitar },
        };
        var lateral = new DockPanel { Width = 360, Margin = new Thickness(8, 0, 12, 0), Children = { botoes, txtDetalhe } };
        DockPanel.SetDock(botoes, Dock.Bottom);

        var corpo = new DockPanel { Children = { lateral, esquerda } };
        DockPanel.SetDock(lateral, Dock.Right);

        var raiz = new DockPanel { Children = { filtros, lblResumo, corpo } };
        DockPanel.SetDock(filtros, Dock.Top);
        DockPanel.SetDock(lblResumo, Dock.Bottom);
        Content = raiz;

        Opened += async (_, _) => await AtualizarLista();
    }

    private static TextBlock Rotulo(string texto) =>
        new() { Text = texto, VerticalAlignment = VerticalAlignment.Center, Margin = new Thickness(10, 0, 6, 0) };

    private static Grid Linha(params string[] valores)
    {
        var grade = new Grid { ColumnDefinitions = new ColumnDefinitions(Colunas) };
        for (var i = 0; i < valores.Length; i++)
        {
            var celula = new TextBlock { Text = valores[i], TextTrimming = TextTrimming.CharacterEllipsis };
            Grid.SetColumn(celula, i);
            grade.Children.Add(celula);
        }
        return grade;
    }

    private static string NomeTipo(string codigo) => Tipos.FirstOrDefault(t => t.Codigo == codigo).Nome ?? codigo;

    private static string Maiuscula(string texto) => texto.Length == 0 ? texto : char.ToUpper(texto[0]) + texto[1..];

    private static Relato? DoJoao(RelatoApi r)
    {
        var (lugar, quando, descricao) = (Lugares.Nome(r.Bairro), r.OcorridoEm.DateTime, r.Descricao ?? "");
        try
        {
            return r.Tipo switch
            {
                "celular" => new RouboCelular(r.Latitude, r.Longitude, lugar, quando, descricao, false),
                "veiculo" => new RouboVeiculo(r.Latitude, r.Longitude, lugar, quando, descricao, false),
                "bicicleta" => new RouboBicicleta(r.Latitude, r.Longitude, lugar, quando, descricao, false),
                _ => null,
            };
        }
        catch (ArgumentException)
        {
            return null;
        }
    }

    private LinhaRelato? Selecionado => lista.SelectedItem as LinhaRelato;

    private async Task AtualizarLista()
    {
        var minha = ++consulta;
        var status = cmbStatus.SelectedIndex <= 0 ? null : StatusApi[cmbStatus.SelectedIndex - 1];
        var tipo = cmbTipo.SelectedIndex <= 0 ? null : Tipos[cmbTipo.SelectedIndex - 1].Codigo;
        var bairro = (txtBairro.Text ?? "").Trim();
        try
        {
            var relatos = await api.Listar(status, tipo);
            var contagens = await Task.WhenAll(StatusApi.Select(api.Contar));
            if (minha != consulta) return;

            var linhas = relatos
                .Where(r => bairro == "" || Lugares.Nome(r.Bairro).Contains(bairro, StringComparison.OrdinalIgnoreCase))
                .Select(r => new LinhaRelato(r, DoJoao(r)))
                .ToList();
            lista.ItemsSource = linhas;
            if (linhas.Count > 0) lista.SelectedIndex = 0;
            lblResumo.Text = $"{linhas.Count} na lista (os mais recentes primeiro) · Pendentes: {contagens[0]} · " +
                             $"Aprovados: {contagens[1]} · Rejeitados: {contagens[2]} · API: {api.Endereco}";
        }
        catch (Exception erro) when (erro is HttpRequestException or TaskCanceledException)
        {
            if (minha != consulta) return;
            lista.ItemsSource = null;
            lblResumo.Text = $"Sem resposta da API em {api.Endereco}. Ela está rodando?";
        }
        MostrarDetalhe();
    }

    private void MostrarDetalhe()
    {
        var linha = Selecionado;
        var podeDecidir = linha != null && usuario.PodeModerar && linha.Api.Status == "pendente";
        btnAprovar.IsEnabled = btnRejeitar.IsEnabled = podeDecidir;

        if (linha == null)
        {
            txtDetalhe.Text = "Selecione um relato.";
            return;
        }
        var r = linha.Api;
        txtDetalhe.Text = string.Join(Environment.NewLine,
            linha.Joao?.Descrever() ?? $"{NomeTipo(r.Tipo)} em {Lugares.Nome(r.Bairro)}, {r.OcorridoEm:dd/MM/yyyy HH:mm}", "",
            linha.Joao == null ? "Prioridade: só para celular, veículo e bicicleta" : $"Prioridade: {linha.Prioridade} de 10",
            $"Local: {r.Latitude:0.000}, {r.Longitude:0.000}",
            $"Descrição: {(string.IsNullOrWhiteSpace(r.Descricao) ? "(sem descrição)" : r.Descricao)}",
            $"Status: {Maiuscula(r.Status)} · Origem: {Maiuscula(r.Origem)}",
            $"Id: {r.Id}");
    }

    private async Task Moderar(bool aprovar)
    {
        if (Selecionado is not { } linha || !usuario.PodeModerar) return;
        try
        {
            if (aprovar)
                await api.MudarStatus(linha.Api.Id, "aprovado", $"Moderado por {usuario.Apelido}");
            else if (await Dialogos.PedirTexto(this, "Motivo da rejeição", "Relato duplicado", "Rejeitar") is { } motivo)
                await api.MudarStatus(linha.Api.Id, "rejeitado", motivo);
            else
                return;
            await AtualizarLista();
        }
        catch (Exception erro) when (erro is HttpRequestException or InvalidOperationException or TaskCanceledException)
        {
            await Dialogos.Aviso(this, "Não foi possível moderar", erro.Message);
        }
    }

    private async Task NovoRelato()
    {
        if (await new JanelaNovoRelato().ShowDialog<Relato?>(this) is not { } relato) return;
        if (Lugares.Codigo(relato.Bairro) is not { } codigo)
        {
            await Dialogos.Aviso(this, "Lugar não encontrado", $"\"{relato.Bairro}\" não está na lista dos 129 lugares. Use o nome exato, como \"Bela Vista\" ou \"Guarulhos\".");
            return;
        }
        var tipo = Tipos.First(t => t.Nome == relato.Tipo).Codigo;
        var quando = new DateTimeOffset(DateTime.SpecifyKind(relato.OcorridoEm, DateTimeKind.Unspecified), TimeSpan.FromHours(-3));
        try
        {
            await api.Criar(new
            {
                tipo, descricao = relato.Descricao, latitude = relato.Latitude, longitude = relato.Longitude,
                bairro = codigo, ocorrido_em = quando, origem = "desktop",
            });
            cmbStatus.SelectedIndex = 1;
            await AtualizarLista();
        }
        catch (Exception erro) when (erro is HttpRequestException or InvalidOperationException or TaskCanceledException)
        {
            await Dialogos.Aviso(this, "Relato não enviado", erro.Message);
        }
    }
}
