using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Data;
using MoskittoRadar.Api.Models;

var builder = WebApplication.CreateBuilder(args);

// O banco fica em App_Data/, dentro da pasta da API. No IIS, só essa pasta precisa de permissão de escrita.
var conexao = new SqliteConnectionStringBuilder(
    builder.Configuration.GetConnectionString("Moskitto") ?? "Data Source=App_Data/moskitto.db");
if (!Path.IsPathRooted(conexao.DataSource))
    conexao.DataSource = Path.Combine(builder.Environment.ContentRootPath, conexao.DataSource);
Directory.CreateDirectory(Path.GetDirectoryName(conexao.DataSource)!);

builder.Services.AddDbContext<AppDbContext>(opcoes => opcoes.UseSqlite(conexao.ToString()));
builder.Services.Configure<CaixaRegiao>(builder.Configuration.GetSection("Regiao"));

// JSON no formato comum do projeto: chaves em snake_case ("ocorrido_em") e enums pelo código ("bolsa_mochila").
void ConfigurarJson(JsonSerializerOptions json)
{
    json.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    json.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
}
builder.Services.ConfigureHttpJsonOptions(opcoes => ConfigurarJson(opcoes.SerializerOptions));
builder.Services.AddControllers()
    .AddJsonOptions(opcoes => ConfigurarJson(opcoes.JsonSerializerOptions))
    .ConfigureApiBehaviorOptions(opcoes =>
    {
        // Sem o ProblemDetails padrão em 404/415 etc.: o UseStatusCodePages abaixo escreve { "erro": "..." }.
        opcoes.SuppressMapClientErrors = true;

        // JSON malformado ou campo com tipo errado: 400 com { "erro": "..." }, não o ProblemDetails padrão.
        opcoes.InvalidModelStateResponseFactory = contexto =>
        {
            var campo = contexto.ModelState
                .Where(item => item.Value?.Errors.Count > 0)
                .Select(item => item.Key.TrimStart('$', '.'))
                .FirstOrDefault(chave => chave.Length > 0);
            var mensagem = campo is null
                ? "JSON inválido."
                : $"JSON inválido ou com tipo errado no campo {campo}.";
            return new BadRequestObjectResult(new RespostaErro(mensagem));
        };
    });
builder.Services.AddOpenApi();

// CORS: o app nativo não precisa, mas o Expo Web e o site do projeto (navegador) precisam.
// A API é pública e sem login, então qualquer origem pode ler e enviar relatos.
builder.Services.AddCors(opcoes => opcoes.AddDefaultPolicy(politica => politica
    .AllowAnyOrigin()
    .WithMethods("GET", "POST", "PATCH")
    .WithHeaders("Content-Type", "Accept", "Idempotency-Key")
    .WithExposedHeaders("X-Total-Count", "Location", "Idempotent-Replayed")));

var app = builder.Build();

// Ao subir: aplica as migrations pendentes e, se o banco estiver vazio, carrega os dados do Coto.
// Assim o banco nasce sozinho no IIS, sem rodar comando no servidor.
using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    CargaInicial.Executar(db, Path.Combine(app.Environment.ContentRootPath, "Dados"), app.Logger);
}

// Erro inesperado: 500 com { "erro": "..." }, sem expor detalhes internos (stack trace) para o cliente.
app.UseExceptionHandler(erro => erro.Run(async contexto =>
{
    var excecao = contexto.Features.Get<IExceptionHandlerFeature>()?.Error;
    app.Logger.LogError(excecao, "Erro não tratado em {Caminho}", contexto.Request.Path);
    contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await contexto.Response.WriteAsJsonAsync(new RespostaErro("Erro interno no servidor. Tente de novo."));
}));

// Respostas de erro sem corpo (rota inexistente, método errado): também viram { "erro": "..." }.
app.UseStatusCodePages(async contexto =>
{
    var resposta = contexto.HttpContext.Response;
    var mensagem = resposta.StatusCode switch
    {
        404 => "Rota não encontrada.",
        405 => "Método não permitido nesta rota.",
        415 => "Envie o corpo como JSON (Content-Type: application/json).",
        _ => "Não foi possível atender a requisição.",
    };
    await resposta.WriteAsJsonAsync(new RespostaErro(mensagem));
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.MapControllers();

app.Run();
