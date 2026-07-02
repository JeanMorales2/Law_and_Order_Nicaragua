using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Seed;
using LegalNic.Application.Billing;

namespace LegalNic.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "The connection string 'DefaultConnection' was not found.");
        }

        services.AddDbContext<LegalNicDbContext>(options =>
            options.UseSqlServer(
                connectionString,
                sqlServerOptions =>
                {
                    sqlServerOptions.MigrationsAssembly(typeof(LegalNicDbContext).Assembly.FullName);
                }));

        services.Configure<BillingOptions>(
            configuration.GetSection(BillingOptions.SectionName));

        return services;
    }

    public static async Task InitialiseDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LegalNicDbContext>();

        await context.Database.MigrateAsync();
        await DbSeeder.SeedAsync(context);
    }
}
