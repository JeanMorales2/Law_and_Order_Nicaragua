using LegalNic.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace LegalNic.Infrastructure.Auth;

public sealed class IdentitySeedHostedService(
    IServiceProvider serviceProvider,
    ILogger<IdentitySeedHostedService> logger,
    IConfiguration configuration,
    IHostEnvironment hostEnvironment) : IHostedService
{
    private readonly IServiceProvider _serviceProvider = serviceProvider;
    private readonly ILogger<IdentitySeedHostedService> _logger = logger;
    private readonly IConfiguration _configuration = configuration;
    private readonly IHostEnvironment _hostEnvironment = hostEnvironment;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var connectionString = _configuration.GetConnectionString("DefaultConnection");
        var connectionDetails = DescribeConnectionString(connectionString);

        try
        {
            using var scope = _serviceProvider.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

            _logger.LogInformation(
                "Starting identity role seed hosted service for environment {Environment}. Connection: {ConnectionDetails}",
                _hostEnvironment.EnvironmentName,
                connectionDetails);

            foreach (var roleName in Enum.GetNames<UserRole>())
            {
                if (await roleManager.RoleExistsAsync(roleName))
                {
                    continue;
                }

                await roleManager.CreateAsync(new IdentityRole<int>(roleName));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Identity role seed hosted service failed in environment {Environment}. Connection: {ConnectionDetails}",
                _hostEnvironment.EnvironmentName,
                connectionDetails);
            throw;
        }
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        return Task.CompletedTask;
    }

    private static string DescribeConnectionString(string? connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return "ConnectionStrings:DefaultConnection is not configured.";
        }

        var builder = new SqlConnectionStringBuilder(connectionString);
        var authenticationMode = builder.IntegratedSecurity ? "IntegratedSecurity" : "SqlAuthentication";

        return $"Server={builder.DataSource}; Database={builder.InitialCatalog}; Authentication={authenticationMode}; MARS={builder.MultipleActiveResultSets}";
    }
}
