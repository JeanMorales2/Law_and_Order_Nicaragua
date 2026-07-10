using System.Text;
using System.Text.Json;
using LegalNic.Application.Auth;
using LegalNic.Application.Availability;
using LegalNic.Application.Categories;
using LegalNic.Application.Messages;
using LegalNic.Application.Notifications;
using LegalNic.Application.Commissions;
using LegalNic.Application.Reviews;
using LegalNic.Application.Admin;
using LegalNic.Application.Lawyers;
using LegalNic.Application.ServiceRequests;
using LegalNic.Application.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Seed;
using LegalNic.Infrastructure.ServiceRequests;
using LegalNic.Application.Billing;
using LegalNic.Infrastructure.Auth;
using LegalNic.Infrastructure.LawyerAvailability;
using LegalNic.Infrastructure.Commissions;
using LegalNic.Infrastructure.Categories;
using LegalNic.Infrastructure.Admin;
using LegalNic.Infrastructure.Lawyers;
using LegalNic.Infrastructure.Messages;
using LegalNic.Infrastructure.Notifications;
using LegalNic.Infrastructure.Reviews;
using LegalNic.Infrastructure.Services;
using Microsoft.Data.SqlClient;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

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

        services.Configure<AuthOptions>(configuration.GetSection(AuthOptions.SectionName));
        services.Configure<NotificationOptions>(
            configuration.GetSection(NotificationOptions.SectionName));

        var authOptions = configuration.GetSection(AuthOptions.SectionName).Get<AuthOptions>()
            ?? throw new InvalidOperationException("The auth configuration section was not found.");

        if (string.IsNullOrWhiteSpace(authOptions.SigningKey))
        {
            throw new InvalidOperationException("The auth signing key must be configured.");
        }

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<IdentityRole<int>>()
            .AddEntityFrameworkStores<LegalNicDbContext>()
            .AddSignInManager();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = authOptions.Issuer,
                    ValidAudience = authOptions.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(authOptions.SigningKey)),
                    ClockSkew = TimeSpan.Zero
                };
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrWhiteSpace(accessToken)
                            && path.StartsWithSegments("/hubs/chat"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    },
                    OnChallenge = async context =>
                    {
                        if (context.Response.HasStarted)
                        {
                            return;
                        }

                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";

                        await context.Response.WriteAsync(JsonSerializer.Serialize(new
                        {
                            error = "Authentication is required to access this resource.",
                            statusCode = StatusCodes.Status401Unauthorized
                        }));
                    },
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";

                        await context.Response.WriteAsync(JsonSerializer.Serialize(new
                        {
                            error = "You do not have permission to access this resource.",
                            statusCode = StatusCodes.Status403Forbidden
                        }));
                    }
                };
            });

        services.AddAuthorization();
        services.AddMemoryCache();

        services.Configure<BillingOptions>(
            configuration.GetSection(BillingOptions.SectionName));

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAvailabilityService, AvailabilityService>();
        services.AddScoped<IAdminCategoryService, AdminCategoryService>();
        services.AddScoped<IAdminMetricsService, AdminMetricsService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<ICommissionService, CommissionService>();
        services.AddScoped<ILawyerProfileService, LawyerProfileService>();
        services.AddScoped<INotificationService, MailKitEmailNotificationService>();
        services.AddSingleton<IPushNotificationService, StubPushNotificationService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IServiceRequestService, ServiceRequestService>();
        services.AddScoped<IServiceService, ServiceService>();
        services.AddScoped<IAdminVerificationService, AdminVerificationService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddHostedService<IdentitySeedHostedService>();

        return services;
    }

    public static async Task InitialiseDatabaseAsync(this IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<LegalNicDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<LegalNicDbContext>>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var hostEnvironment = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var connectionDetails = DescribeConnectionString(connectionString);

        try
        {
            logger.LogInformation(
                "Applying database migrations in environment {Environment}. Connection: {ConnectionDetails}",
                hostEnvironment.EnvironmentName,
                connectionDetails);

            await context.Database.MigrateAsync();

            logger.LogInformation(
                "Database migrations completed successfully. Starting application seed. Connection: {ConnectionDetails}",
                connectionDetails);

            await DbSeeder.SeedAsync(context, roleManager);

            logger.LogInformation(
                "Application seed completed successfully. Connection: {ConnectionDetails}",
                connectionDetails);
        }
        catch (Exception ex)
        {
            logger.LogError(
                ex,
                "Database initialization failed in environment {Environment}. Connection: {ConnectionDetails}",
                hostEnvironment.EnvironmentName,
                connectionDetails);
            throw;
        }
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
