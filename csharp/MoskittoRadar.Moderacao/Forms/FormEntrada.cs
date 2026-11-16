using MoskittoRadar.Moderacao.Models;

namespace MoskittoRadar.Moderacao.Forms;

/// <summary>Tela inicial: o usuário informa o apelido e escolhe se é cidadão ou moderador.</summary>
public class FormEntrada : Form
{
    private readonly TextBox txtApelido = new TextBox { Location = new Point(20, 45), Width = 260 };
    private readonly RadioButton rbModerador = new RadioButton { Text = "Moderador", Location = new Point(20, 80), Checked = true, AutoSize = true };
    private readonly RadioButton rbCidadao = new RadioButton { Text = "Cidadão", Location = new Point(140, 80), AutoSize = true };

    /// <summary>Quem entrou. Fica nulo se a tela for fechada.</summary>
    public Usuario? Usuario { get; private set; }

    public FormEntrada()
    {
        Text = "Moskitto Radar · Entrar";
        ClientSize = new Size(300, 160);
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        StartPosition = FormStartPosition.CenterScreen;

        var btnEntrar = new Button { Text = "Entrar", Location = new Point(180, 115), Width = 100 };
        btnEntrar.Click += Entrar;
        AcceptButton = btnEntrar;

        Controls.Add(new Label { Text = "Apelido (sem nome real):", Location = new Point(20, 20), AutoSize = true });
        Controls.AddRange([txtApelido, rbModerador, rbCidadao, btnEntrar]);
    }

    private void Entrar(object? sender, EventArgs e)
    {
        try
        {
            // Polimorfismo: a tela principal só pergunta usuario.PodeModerar, sem saber qual é a classe.
            Usuario = rbModerador.Checked ? new Moderador(txtApelido.Text) : new Cidadao(txtApelido.Text);
            DialogResult = DialogResult.OK;
        }
        catch (ArgumentException erro)
        {
            MessageBox.Show(erro.Message, "Apelido inválido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
        }
    }
}
