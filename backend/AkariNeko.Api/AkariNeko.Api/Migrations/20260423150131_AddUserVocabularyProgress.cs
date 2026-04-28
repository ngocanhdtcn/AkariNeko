using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AkariNeko.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserVocabularyProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserVocabularyProgresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<string>(type: "TEXT", nullable: false),
                    VocabularyId = table.Column<int>(type: "INTEGER", nullable: false),
                    CorrectCount = table.Column<int>(type: "INTEGER", nullable: false),
                    WrongCount = table.Column<int>(type: "INTEGER", nullable: false),
                    IsDifficult = table.Column<bool>(type: "INTEGER", nullable: false),
                    LastStudiedAt = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserVocabularyProgresses", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserVocabularyProgresses");
        }
    }
}
