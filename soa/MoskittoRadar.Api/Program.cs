using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// O banco fica em App_Data/, dentro da pasta da API. No IIS, só essa pasta precisa de permissão de escrita.
var conexao = new SqliteConnectionStringBuilder(
    builder.Configuration.GetConnectionString("Moskitto") ?? "Data Source=App_Data/moskitto.db");
if (!Path.IsPathRooted(conexao.DataSource))
    conexao.DataSource = Path.Combine(builder.Environment.ContentRootPath, conexao.DataSource);
Directory.CreateDirectory(Path.GetDirectoryName(conexao.DataSource)!);

builder.Services.AddDbContext<AppDbContext>(opcoes => opcoes.UseSqlite(conexao.ToString()));
builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Ao subir: aplica as migrations pendentes e, se o banco estiver vazio, carrega os dados do Coto.
// Assim o banco nasce sozinho no IIS, sem rodar comando no servidor.
using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    CargaInicial.Executar(db, Path.Combine(app.Environment.ContentRootPath, "Dados"), app.Logger);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapControllers();

app.Run();
