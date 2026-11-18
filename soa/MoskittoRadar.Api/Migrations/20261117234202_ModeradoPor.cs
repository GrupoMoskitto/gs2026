using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MoskittoRadar.Api.Migrations
{
    /// <inheritdoc />
    public partial class ModeradoPor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModeradoPor",
                table: "moderacoes",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModeradoPor",
                table: "moderacoes");
        }
    }
}
