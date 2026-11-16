using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoskittoRadar.Api.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "lugares",
                columns: table => new
                {
                    Codigo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 80, nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    CodIbge = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lugares", x => x.Codigo);
                });

            migrationBuilder.CreateTable(
                name: "previsoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Bairro = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FaixaHoraria = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    NivelRisco = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Score = table.Column<double>(type: "REAL", nullable: false),
                    GeradoEm = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_previsoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_previsoes_lugares_Bairro",
                        column: x => x.Bairro,
                        principalTable: "lugares",
                        principalColumn: "Codigo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "relatos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", maxLength: 280, nullable: true),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    Bairro = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    OcorridoEm = table.Column<long>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<long>(type: "INTEGER", nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Origem = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ChaveIdempotencia = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_relatos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_relatos_lugares_Bairro",
                        column: x => x.Bairro,
                        principalTable: "lugares",
                        principalColumn: "Codigo",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "moderacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RelatoId = table.Column<Guid>(type: "TEXT", nullable: false),
                    StatusAnterior = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Decisao = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Motivo = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    DecididoEm = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_moderacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_moderacoes_relatos_RelatoId",
                        column: x => x.RelatoId,
                        principalTable: "relatos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_moderacoes_RelatoId",
                table: "moderacoes",
                column: "RelatoId");

            migrationBuilder.CreateIndex(
                name: "IX_previsoes_Bairro_FaixaHoraria",
                table: "previsoes",
                columns: new[] { "Bairro", "FaixaHoraria" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_relatos_Bairro",
                table: "relatos",
                column: "Bairro");

            migrationBuilder.CreateIndex(
                name: "IX_relatos_ChaveIdempotencia",
                table: "relatos",
                column: "ChaveIdempotencia",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_relatos_OcorridoEm",
                table: "relatos",
                column: "OcorridoEm");

            migrationBuilder.CreateIndex(
                name: "IX_relatos_Status",
                table: "relatos",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_relatos_Tipo",
                table: "relatos",
                column: "Tipo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "moderacoes");

            migrationBuilder.DropTable(
                name: "previsoes");

            migrationBuilder.DropTable(
                name: "relatos");

            migrationBuilder.DropTable(
                name: "lugares");
        }
    }
}
