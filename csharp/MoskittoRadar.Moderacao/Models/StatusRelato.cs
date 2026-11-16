namespace MoskittoRadar.Moderacao.Models;

/// <summary>Situação do relato na moderação. Todo relato novo começa pendente.</summary>
public enum StatusRelato
{
    Pendente,
    Aprovado,
    Rejeitado,
}
