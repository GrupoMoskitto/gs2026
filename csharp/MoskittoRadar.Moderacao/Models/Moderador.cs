namespace MoskittoRadar.Moderacao.Models;

/// <summary>Moderador: confere os relatos pendentes e aprova ou rejeita.</summary>
public class Moderador : Usuario
{
    public Moderador(string apelido) : base(apelido)
    {
    }

    public override string Papel => "Moderador";

    public override bool PodeModerar => true;

    /// <summary>Quantos relatos este moderador já decidiu.</summary>
    public int Decididos { get; private set; }

    public void Aprovar(Relato relato)
    {
        relato.MudarStatus(StatusRelato.Aprovado, this, "");
        Decididos++;
    }

    public void Rejeitar(Relato relato, string motivo)
    {
        relato.MudarStatus(StatusRelato.Rejeitado, this, motivo);
        Decididos++;
    }
}
