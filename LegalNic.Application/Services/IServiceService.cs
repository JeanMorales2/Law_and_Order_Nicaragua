using LegalNic.Application.Common;

namespace LegalNic.Application.Services;

public interface IServiceService
{
    Task<OwnedServiceResponse> CreateMyServiceAsync(
        int userId,
        CreateServiceRequest request,
        CancellationToken cancellationToken = default);

    Task<OwnedServiceResponse> UpdateMyServiceAsync(
        int userId,
        int serviceId,
        UpdateServiceRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteMyServiceAsync(
        int userId,
        int serviceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<OwnedServiceResponse>> GetMyServicesAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<SearchServiceResponse>> SearchAsync(
        SearchServicesRequest request,
        CancellationToken cancellationToken = default);
}
