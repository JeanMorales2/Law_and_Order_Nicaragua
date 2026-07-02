using Microsoft.Extensions.DependencyInjection;
using LegalNic.Application.Billing;

namespace LegalNic.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IPlatformCommissionFactory, PlatformCommissionFactory>();

        return services;
    }
}
