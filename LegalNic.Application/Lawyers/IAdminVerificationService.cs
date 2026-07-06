using LegalNic.Domain.Enums;

namespace LegalNic.Application.Lawyers;

public interface IAdminVerificationService
{
    Task<IReadOnlyCollection<AdminVerificationDocumentResponse>> GetVerificationDocumentsAsync(
        DocumentReviewStatus status,
        CancellationToken cancellationToken = default);

    Task<VerificationDocumentResponse> ApproveAsync(
        int documentId,
        int adminUserId,
        CancellationToken cancellationToken = default);

    Task<VerificationDocumentResponse> RejectAsync(
        int documentId,
        int adminUserId,
        CancellationToken cancellationToken = default);
}
