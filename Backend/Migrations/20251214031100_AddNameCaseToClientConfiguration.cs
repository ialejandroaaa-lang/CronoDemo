using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosCrono.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNameCaseToClientConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NameCase",
                table: "ClientConfigurations",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NameCase",
                table: "ClientConfigurations");
        }
    }
}
