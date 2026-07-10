using LegalNic.Domain.Enums;

namespace LegalNic.Application.Commissions;

public interface ICommissionService
{
    Task<LawyerCommissionAccountResponse> GetMyCommissionsAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<AdminCommissionListItemResponse>> GetAdminCommissionsAsync(
        PlatformCommissionStatus? status,
        int? lawyerProfileId,
        CancellationToken cancellationToken = default);

    Task<AdminCommissionListItemResponse> MarkAsPaidAsync(
        int commissionId,
        CancellationToken cancellationToken = default);
}
