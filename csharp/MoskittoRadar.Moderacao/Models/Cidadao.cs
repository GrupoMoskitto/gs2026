namespace MoskittoRadar.Moderacao.Models;

/// <summary>Morador que relata um roubo. Não pode moderar.</summary>
public class Cidadao : Usuario
{
    public Cidadao(string apelido) : base(apelido)
    {
    }

    public override string Papel => "Cidadão";

    public override bool PodeModerar => false;
}
