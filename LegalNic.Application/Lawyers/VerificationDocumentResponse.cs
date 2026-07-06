using LegalNic.Domain.Enums;

namespace LegalNic.Application.Lawyers;

public sealed class VerificationDocumentResponse
{
    public int Id { get; init; }

    public int LawyerProfileId { get; init; }

    public string DocumentType { get; init; } = string.Empty;

    public string FileUrl { get; init; } = string.Empty;

    public DocumentReviewStatus Status { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? ReviewedAt { get; init; }

    public int? ReviewedByAdminId { get; init; }
}
