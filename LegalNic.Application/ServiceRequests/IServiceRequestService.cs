using LegalNic.Domain.Enums;

namespace LegalNic.Application.ServiceRequests;

public interface IServiceRequestService
{
    Task<ServiceRequestDetailResponse> CreateAsync(
        int clientUserId,
        CreateServiceRequestRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<ServiceRequestSummaryResponse>> GetMineAsync(
        int clientUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<ServiceRequestSummaryResponse>> GetReceivedAsync(
        int lawyerUserId,
        ServiceRequestStatus? status,
        CancellationToken cancellationToken = default);

    Task<ServiceRequestDetailResponse> GetByIdAsync(
        int currentUserId,
        bool isAdmin,
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task<ServiceRequestDetailResponse> AcceptAsync(
        int lawyerUserId,
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task<ServiceRequestDetailResponse> RejectAsync(
        int lawyerUserId,
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task<ServiceRequestDetailResponse> CompleteAsync(
        int lawyerUserId,
        int serviceRequestId,
        CompleteServiceRequestRequest request,
        CancellationToken cancellationToken = default);
}
