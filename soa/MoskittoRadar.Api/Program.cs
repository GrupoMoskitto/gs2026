using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MoskittoRadar.Api.Data;
using MoskittoRadar.Api.Models;
using MoskittoRadar.Api.Seguranca;

var builder = WebApplication.CreateBuilder(args);

// O banco fica em App_Data/, dentro da pasta da API. No IIS, só essa pasta precisa de permissão de escrita.
var pastaBanco = Path.Combine(builder.Environment.ContentRootPath, "App_Data");
Directory.CreateDirectory(pastaBanco);
builder.Services.AddDbContext<AppDbContext>(opcoes =>
    opcoes.UseSqlite($"Data Source={Path.Combine(pastaBanco, "moskitto.db")}"));

builder.Services.AddControllers()
    .AddJsonOptions(opcoes =>
    {
        // Formato comum do projeto: chaves em snake_case ("ocorrido_em") e enums pelo código ("bolsa_mochila").
        opcoes.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        opcoes.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
    })
    .ConfigureApiBehaviorOptions(opcoes =>
    {
        // Sem o ProblemDetails padrão: todo erro sai como { "erro": "..." } (ver UseStatusCodePages abaixo).
        opcoes.SuppressMapClientErrors = true;
        opcoes.InvalidModelStateResponseFactory = contexto =>
        {
            // JSON malformado ou valor com tipo errado (ex.: "latitude": "abc", ?limite=abc).
            var campo = contexto.ModelState.Where(item => item.Value?.Errors.Count > 0)
                .Select(item => item.Key.TrimStart('$', '.')).FirstOrDefault(chave => chave.Length > 0);
            return new BadRequestObjectResult(new RespostaErro(campo is null ? "JSON inválido." : $"Valor inválido no campo {campo}."));
        };
    });
builder.Services.AddOpenApi();
builder.Services.AddSingleton<Moderadores>();

// CORS: o app nativo não precisa, mas o Expo Web e o site do projeto (navegador) precisam.
builder.Services.AddCors(opcoes => opcoes.AddDefaultPolicy(politica => politica
    .AllowAnyOrigin()
    .WithMethods("GET", "POST", "PATCH")
    .WithHeaders("Content-Type", "Accept", "Idempotency-Key", "Authorization")
    .WithExposedHeaders("X-Total-Count", "Location", "Idempotent-Replayed")));

var app = builder.Build();

// Ao subir: aplica as migrations e, se o banco estiver vazio, carrega os dados do Coto. Nada a rodar no servidor.
using (var escopo = app.Services.CreateScope())
{
    var db = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    CargaInicial.Executar(db, Path.Combine(app.Environment.ContentRootPath, "Dados"), app.Logger);
}

// Erro inesperado: 500 sem expor detalhes internos. O erro completo vai para o log.
app.UseExceptionHandler(erro => erro.Run(contexto =>
{
    contexto.Response.StatusCode = StatusCodes.Status500InternalServerError;
    return contexto.Response.WriteAsJsonAsync(new RespostaErro("Erro interno no servidor. Tente de novo."));
}));

// Respostas de erro sem corpo (rota inexistente, método errado...) também viram { "erro": "..." }.
app.UseStatusCodePages(contexto => contexto.HttpContext.Response.WriteAsJsonAsync(new RespostaErro(
    contexto.HttpContext.Response.StatusCode switch
    {
        404 => "Rota não encontrada.",
        405 => "Método não permitido nesta rota.",
        415 => "Envie o corpo como JSON (Content-Type: application/json).",
        _ => "Não foi possível atender a requisição.",
    })));

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors();
app.MapControllers();
app.Run();
