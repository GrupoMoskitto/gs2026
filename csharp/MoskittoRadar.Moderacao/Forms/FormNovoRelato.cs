using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Forms;

/// <summary>Cadastro de um relato novo. As regras ficam nas classes: aqui só mostramos o erro que elas lançam.</summary>
public class FormNovoRelato : Form
{
    private readonly ComboBox cmbTipo = new ComboBox { DropDownStyle = ComboBoxStyle.DropDownList, Width = 200 };
    private readonly TextBox txtBairro = new TextBox { Width = 200, Text = "Bela Vista" };
    private readonly NumericUpDown numLatitude = CampoCoordenada(-23.561m);
    private readonly NumericUpDown numLongitude = CampoCoordenada(-46.656m);
    private readonly DateTimePicker dtpQuando = new DateTimePicker { Width = 200, Format = DateTimePickerFormat.Custom, CustomFormat = "dd/MM/yyyy HH:mm" };
    private readonly TextBox txtDescricao = new TextBox { Width = 300, Height = 60, Multiline = true, MaxLength = 400 };
    private readonly CheckBox chkExtra = new CheckBox { AutoSize = true };

    /// <summary>O relato criado. Fica nulo se o usuário cancelar.</summary>
    public Relato? Relato { get; private set; }

    public FormNovoRelato()
    {
        Text = "Novo relato";
        Icon = Program.Icone;
        ClientSize = new Size(450, 330);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterParent;

        cmbTipo.Items.AddRange(["Celular", "Veículo", "Bicicleta"]);
        cmbTipo.SelectedIndexChanged += (_, _) => chkExtra.Text = TextoExtra();
        cmbTipo.SelectedIndex = 0;

        var btnSalvar = new Button { Text = "Salvar", Width = 100, Location = new Point(330, 290) };
        btnSalvar.Click += Salvar;
        AcceptButton = btnSalvar;

        var y = 15;
        foreach (var (rotulo, campo) in new (string, Control)[]
        {
            ("Tipo", cmbTipo), ("Bairro", txtBairro), ("Latitude", numLatitude), ("Longitude", numLongitude),
            ("Quando", dtpQuando), ("Descrição", txtDescricao), ("", chkExtra),
        })
        {
            Controls.Add(new Label { Text = rotulo, Location = new Point(15, y + 3), AutoSize = true });
            campo.Location = new Point(120, y);
            Controls.Add(campo);
            y += campo == txtDescricao ? 70 : 32;
        }
        Controls.Add(btnSalvar);
    }

    private static NumericUpDown CampoCoordenada(decimal valor) =>
        new NumericUpDown { Width = 200, DecimalPlaces = 3, Increment = 0.001m, Minimum = -90, Maximum = 90, Value = valor };

    private string TextoExtra() => cmbTipo.SelectedIndex switch
    {
        0 => "Foi no transporte público (ônibus, metrô, ponto)",
        1 => "Era uma moto",
        _ => "Bicicleta compartilhada (de aluguel)",
    };

    private void Salvar(object? sender, EventArgs e)
    {
        var latitude = (double)numLatitude.Value;
        var longitude = (double)numLongitude.Value;
        try
        {
            // Cria a subclasse certa. Os construtores validam coordenada, bairro, data e descrição.
            Relato = cmbTipo.SelectedIndex switch
            {
                0 => new RouboCelular(latitude, longitude, txtBairro.Text, dtpQuando.Value, txtDescricao.Text, chkExtra.Checked),
                1 => new RouboVeiculo(latitude, longitude, txtBairro.Text, dtpQuando.Value, txtDescricao.Text, chkExtra.Checked),
                _ => new RouboBicicleta(latitude, longitude, txtBairro.Text, dtpQuando.Value, txtDescricao.Text, chkExtra.Checked),
            };
            DialogResult = DialogResult.OK;
        }
        catch (ArgumentException erro)
        {
            MessageBox.Show(erro.Message, "Relato inválido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }
}
