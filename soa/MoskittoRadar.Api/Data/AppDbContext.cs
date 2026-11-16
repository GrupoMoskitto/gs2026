using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Models;

namespace MoskittoRadar.Api.Data;

/// <summary>
/// Banco SQLite da API. Todas as consultas passam pelo EF Core (LINQ), que gera SQL parametrizado:
/// nenhuma consulta é montada juntando texto.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Lugar> Lugares => Set<Lugar>();
    public DbSet<Relato> Relatos => Set<Relato>();
    public DbSet<Moderacao> Moderacoes => Set<Moderacao>();
    public DbSet<PrevisaoRisco> Previsoes => Set<PrevisaoRisco>();

    /// <summary>O código é um dos 129 lugares? Usado para validar o campo "bairro".</summary>
    public Task<bool> LugarExiste(string codigo, CancellationToken cancelamento) =>
        Lugares.AnyAsync(l => l.Codigo == codigo, cancelamento);

    protected override void ConfigureConventions(ModelConfigurationBuilder configuracao)
    {
        // Datas como número ordenável (ver DataUtcConverter) e enums com o código do JSON.
        configuracao.Properties<DateTimeOffset>().HaveConversion<DataUtcConverter>();
        configuracao.Properties<TipoRelato>().HaveConversion<CodigoEnumConverter<TipoRelato>>().HaveMaxLength(20);
        configuracao.Properties<StatusRelato>().HaveConversion<CodigoEnumConverter<StatusRelato>>().HaveMaxLength(20);
        configuracao.Properties<OrigemRelato>().HaveConversion<CodigoEnumConverter<OrigemRelato>>().HaveMaxLength(20);
        configuracao.Properties<FaixaHoraria>().HaveConversion<CodigoEnumConverter<FaixaHoraria>>().HaveMaxLength(20);
        configuracao.Properties<NivelRisco>().HaveConversion<CodigoEnumConverter<NivelRisco>>().HaveMaxLength(20);
        configuracao.Properties<TipoLugar>().HaveConversion<CodigoEnumConverter<TipoLugar>>().HaveMaxLength(20);
    }

    protected override void OnModelCreating(ModelBuilder modelo)
    {
        modelo.Entity<Lugar>(lugar =>
        {
            lugar.ToTable("lugares");
            lugar.HasKey(l => l.Codigo);
            lugar.Property(l => l.Codigo).HasMaxLength(20);
            lugar.Property(l => l.Nome).HasMaxLength(80).IsRequired();
            lugar.Property(l => l.CodIbge).HasMaxLength(10).IsRequired();
        });

        modelo.Entity<Relato>(relato =>
        {
            relato.ToTable("relatos");
            relato.HasKey(r => r.Id);
            relato.Property(r => r.Descricao).HasMaxLength(Relato.TamanhoMaximoDescricao);
            relato.Property(r => r.Bairro).HasMaxLength(20).IsRequired();
            relato.Property(r => r.ChaveIdempotencia).HasMaxLength(100);

            relato.HasOne(r => r.Lugar)
                .WithMany()
                .HasForeignKey(r => r.Bairro)
                .OnDelete(DeleteBehavior.Restrict);

            // Índices para os filtros da rota GET /api/relatos e para a ordenação por data.
            relato.HasIndex(r => r.Bairro);
            relato.HasIndex(r => r.Status);
            relato.HasIndex(r => r.Tipo);
            relato.HasIndex(r => r.OcorridoEm);

            // A mesma chave de idempotência não pode criar dois relatos.
            relato.HasIndex(r => r.ChaveIdempotencia).IsUnique();
        });

        modelo.Entity<Moderacao>(moderacao =>
        {
            moderacao.ToTable("moderacoes");
            moderacao.Property(m => m.Motivo).HasMaxLength(200);
            moderacao.HasOne(m => m.Relato)
                .WithMany(r => r.Moderacoes)
                .HasForeignKey(m => m.RelatoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelo.Entity<PrevisaoRisco>(previsao =>
        {
            previsao.ToTable("previsoes");
            previsao.Property(p => p.Bairro).HasMaxLength(20).IsRequired();
            previsao.HasOne(p => p.Lugar)
                .WithMany()
                .HasForeignKey(p => p.Bairro)
                .OnDelete(DeleteBehavior.Cascade);

            // Uma previsão por lugar e faixa horária.
            previsao.HasIndex(p => new { p.Bairro, p.FaixaHoraria }).IsUnique();
        });
    }
}
