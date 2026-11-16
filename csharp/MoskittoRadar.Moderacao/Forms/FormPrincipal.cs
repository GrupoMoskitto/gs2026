using MoskittoRadar.Moderacao.Models;
using MoskittoRadar.Moderacao.Services;

namespace MoskittoRadar.Moderacao.Forms;

/// <summary>Tela principal: lista com filtros, detalhe do relato selecionado, aprovar, rejeitar e novo relato.</summary>
public class FormPrincipal : Form
{
    private readonly RepositorioRelatos repositorio;
    private readonly Usuario usuario;

    private readonly ComboBox cmbTipo = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = 110 };
    private readonly ComboBox cmbStatus = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = 110 };
    private readonly TextBox txtBairro = new TextBox { Width = 140, PlaceholderText = "Bairro" };
    private readonly DataGridView grade = new DataGridView
    {
        Dock = DockStyle.Fill, ReadOnly = true, AllowUserToAddRows = false, MultiSelect = false, RowHeadersVisible = false,
        SelectionMode = DataGridViewSelectionMode.FullRowSelect, AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill,
    };
    private readonly TextBox txtDetalhe = new TextBox { Dock = DockStyle.Fill, Multiline = true, ReadOnly = true, Font = new Font("Segoe UI", 10) };
    private readonly Button btnAprovar = new Button { Text = "Aprovar", Width = 110 };
    private readonly Button btnRejeitar = new Button { Text = "Rejeitar", Width = 110 };
    private readonly ToolStripStatusLabel lblResumo = new ToolStripStatusLabel();

    public FormPrincipal(RepositorioRelatos repositorio, Usuario usuario)
    {
        this.repositorio = repositorio;
        this.usuario = usuario;

        Text = $"Moskitto Radar · Moderação de relatos · {usuario}";
        ClientSize = new Size(1000, 560);
        StartPosition = FormStartPosition.CenterScreen;

        cmbTipo.Items.AddRange(["Todos", "Celular", "Veículo", "Bicicleta"]);
        cmbStatus.Items.AddRange(["Todos", "Pendente", "Aprovado", "Rejeitado"]);
        cmbTipo.SelectedIndex = 0;
        cmbStatus.SelectedIndex = 1; // começa mostrando a fila de pendentes
        cmbTipo.SelectedIndexChanged += (_, _) => AtualizarLista();
        cmbStatus.SelectedIndexChanged += (_, _) => AtualizarLista();
        txtBairro.TextChanged += (_, _) => AtualizarLista();

        var btnNovo = new Button { Text = "Novo relato", Width = 110 };
        btnNovo.Click += NovoRelato;
        btnAprovar.Click += (_, _) => Moderar(aprovar: true);
        btnRejeitar.Click += (_, _) => Moderar(aprovar: false);

        var filtros = new FlowLayoutPanel { Dock = DockStyle.Top, Height = 40, Padding = new Padding(8) };
        filtros.Controls.AddRange([new Label { Text = "Tipo", AutoSize = true, Margin = new Padding(0, 6, 0, 0) }, cmbTipo,
            new Label { Text = "Status", AutoSize = true, Margin = new Padding(10, 6, 0, 0) }, cmbStatus, txtBairro, btnNovo]);

        grade.Columns.Add("id", "#");
        grade.Columns.Add("prioridade", "Prioridade");
        grade.Columns.Add("tipo", "Tipo");
        grade.Columns.Add("bairro", "Bairro");
        grade.Columns.Add("quando", "Quando");
        grade.Columns.Add("status", "Status");
        grade.SelectionChanged += (_, _) => MostrarDetalhe();

        var botoes = new FlowLayoutPanel { Dock = DockStyle.Bottom, Height = 40, FlowDirection = FlowDirection.RightToLeft };
        botoes.Controls.AddRange([btnRejeitar, btnAprovar]);
        var lateral = new Panel { Dock = DockStyle.Right, Width = 340, Padding = new Padding(8) };
        lateral.Controls.AddRange([txtDetalhe, botoes]);

        var rodape = new StatusStrip();
        rodape.Items.Add(lblResumo);

        Controls.AddRange([grade, lateral, filtros, rodape]);
        Load += (_, _) => AtualizarLista();
    }

    private Relato? Selecionado => grade.CurrentRow?.Tag as Relato;

    private void AtualizarLista()
    {
        StatusRelato? status = cmbStatus.SelectedIndex == 0 ? null : (StatusRelato)(cmbStatus.SelectedIndex - 1);
        grade.Rows.Clear();
        foreach (var relato in repositorio.Filtrar(cmbTipo.Text, status, txtBairro.Text))
        {
            var linha = grade.Rows.Add(relato.Id, relato.CalcularPrioridade(), relato.Tipo, relato.Bairro,
                relato.OcorridoEm.ToString("dd/MM HH:mm"), relato.Status);
            grade.Rows[linha].Tag = relato;
        }
        if (grade.Rows.Count > 0 && grade.IsHandleCreated)
            grade.CurrentCell = grade.Rows[0].Cells[0]; // já deixa o primeiro (mais prioritário) selecionado
        lblResumo.Text = $"{grade.Rows.Count} na lista · Pendentes: {repositorio.Contar(StatusRelato.Pendente)} · " +
                         $"Aprovados: {repositorio.Contar(StatusRelato.Aprovado)} · Rejeitados: {repositorio.Contar(StatusRelato.Rejeitado)}";
        MostrarDetalhe();
    }

    private void MostrarDetalhe()
    {
        var relato = Selecionado;
        // Só o moderador decide, e só relato pendente (a regra também está na classe Relato).
        var podeDecidir = relato != null && usuario.PodeModerar && relato.Status == StatusRelato.Pendente;
        btnAprovar.Enabled = btnRejeitar.Enabled = podeDecidir;

        if (relato == null)
        {
            txtDetalhe.Text = "Selecione um relato.";
            return;
        }
        txtDetalhe.Text = string.Join(Environment.NewLine,
            relato.Descrever(), "",
            $"Prioridade: {relato.CalcularPrioridade()} de 10",
            $"Local: {relato.Latitude:0.000}, {relato.Longitude:0.000}",
            $"Descrição: {(relato.Descricao == "" ? "(sem descrição)" : relato.Descricao)}",
            relato.ModeradoPor == "" ? "" : $"Moderado por: {relato.ModeradoPor}",
            relato.Motivo == "" ? "" : $"Motivo: {relato.Motivo}");
    }

    private void Moderar(bool aprovar)
    {
        if (Selecionado is not { } relato || usuario is not Moderador moderador) return;
        try
        {
            if (aprovar)
                moderador.Aprovar(relato);
            else if (PedirMotivo() is { } motivo)
                moderador.Rejeitar(relato, motivo);
            else
                return; // cancelou
            AtualizarLista();
        }
        catch (Exception erro) when (erro is ArgumentException or InvalidOperationException)
        {
            MessageBox.Show(erro.Message, "Não foi possível moderar", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }

    /// <summary>Caixinha para digitar o motivo da rejeição. Devolve null se cancelar.</summary>
    private string? PedirMotivo()
    {
        using var janela = new Form { Text = "Motivo da rejeição", ClientSize = new Size(360, 90), FormBorderStyle = FormBorderStyle.FixedDialog, StartPosition = FormStartPosition.CenterParent, MaximizeBox = false, MinimizeBox = false };
        var txtMotivo = new TextBox { Location = new Point(12, 12), Width = 336, Text = "Relato duplicado" };
        var btnOk = new Button { Text = "Rejeitar", Location = new Point(248, 50), Width = 100, DialogResult = DialogResult.OK };
        janela.Controls.AddRange([txtMotivo, btnOk]);
        janela.AcceptButton = btnOk;
        return janela.ShowDialog(this) == DialogResult.OK ? txtMotivo.Text : null;
    }

    private void NovoRelato(object? sender, EventArgs e)
    {
        using var tela = new FormNovoRelato();
        if (tela.ShowDialog(this) != DialogResult.OK || tela.Relato == null) return;
        repositorio.Adicionar(tela.Relato);
        cmbStatus.SelectedIndex = 1; // o novo entra como pendente
        AtualizarLista();
    }
}
