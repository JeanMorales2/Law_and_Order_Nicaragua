using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LegalNic.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformCommissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "AgreedPrice",
                table: "ServiceRequests",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PlatformCommissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ServiceRequestId = table.Column<int>(type: "int", nullable: false),
                    LawyerProfileId = table.Column<int>(type: "int", nullable: false),
                    AgreedPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    CommissionRate = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SettledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlatformCommissions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlatformCommissions_LawyerProfiles_LawyerProfileId",
                        column: x => x.LawyerProfileId,
                        principalTable: "LawyerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PlatformCommissions_ServiceRequests_ServiceRequestId",
                        column: x => x.ServiceRequestId,
                        principalTable: "ServiceRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformCommissions_LawyerProfileId_Status",
                table: "PlatformCommissions",
                columns: new[] { "LawyerProfileId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PlatformCommissions_ServiceRequestId",
                table: "PlatformCommissions",
                column: "ServiceRequestId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlatformCommissions");

            migrationBuilder.DropColumn(
                name: "AgreedPrice",
                table: "ServiceRequests");
        }
    }
}
