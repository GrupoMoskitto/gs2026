namespace MoskittoRadar.Moderacao.Models;

/// <summary>
/// Quem usa o sistema. Classe abstrata: Cidadao relata, Moderador também aprova e rejeita.
/// Só apelido, sem nome real (o projeto não guarda dado pessoal).
/// </summary>
public abstract class Usuario
{
    private string apelido = "";

    protected Usuario(string apelido)
    {
        Apelido = apelido;
    }

    public string Apelido
    {
        get => apelido;
        set
        {
            var texto = (value ?? "").Trim();
            if (texto.Length < 2 || texto.Length > 24)
                throw new ArgumentException("O apelido precisa ter de 2 a 24 caracteres.");
            apelido = texto;
        }
    }

    /// <summary>Nome do papel para mostrar na tela.</summary>
    public abstract string Papel { get; }

    /// <summary>Se pode aprovar e rejeitar relatos.</summary>
    public abstract bool PodeModerar { get; }

    public override string ToString() => $"{Apelido} ({Papel})";
}
