namespace LegalNic.Application.Admin;

public interface IAdminMetricsService
{
    Task<AdminMetricsResponse> GetAsync(CancellationToken cancellationToken = default);
}
