using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace LegalNic.Infrastructure.Persistence;

public sealed class LegalNicDbContextFactory : IDesignTimeDbContextFactory<LegalNicDbContext>
{
    public LegalNicDbContext CreateDbContext(string[] args)
    {
        var apiProjectPath = ResolveApiProjectPath();
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";

        var configuration = new ConfigurationBuilder()
            .SetBasePath(apiProjectPath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile($"appsettings.{environment}.json", optional: true)
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "The connection string 'DefaultConnection' was not found for design-time operations.");

        var optionsBuilder = new DbContextOptionsBuilder<LegalNicDbContext>();
        optionsBuilder.UseSqlServer(
            connectionString,
            sqlServerOptions =>
            {
                sqlServerOptions.MigrationsAssembly(typeof(LegalNicDbContext).Assembly.FullName);
            });

        return new LegalNicDbContext(optionsBuilder.Options);
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var directPath = Path.Combine(currentDirectory, "LegalNic.Api");

        if (Directory.Exists(directPath))
        {
            return directPath;
        }

        var siblingPath = Path.GetFullPath(Path.Combine(currentDirectory, "..", "LegalNic.Api"));

        if (Directory.Exists(siblingPath))
        {
            return siblingPath;
        }

        throw new DirectoryNotFoundException("Could not locate the LegalNic.Api project for design-time EF operations.");
    }
}
