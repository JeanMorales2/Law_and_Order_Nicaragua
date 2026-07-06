using LegalNic.Domain.Enums;

namespace LegalNic.Application.Lawyers;

public sealed class AdminVerificationDocumentResponse
{
    public int Id { get; init; }

    public int LawyerProfileId { get; init; }

    public int UserId { get; init; }

    public string LawyerFullName { get; init; } = string.Empty;

    public string DocumentType { get; init; } = string.Empty;

    public string FileUrl { get; init; } = string.Empty;

    public DocumentReviewStatus Status { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? ReviewedAt { get; init; }
}
