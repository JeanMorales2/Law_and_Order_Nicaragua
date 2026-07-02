using LegalNic.Domain.Common;
using LegalNic.Domain.Enums;

namespace LegalNic.Domain.Entities;

public sealed class VerificationDocument : AuditableEntity
{
    public int LawyerProfileId { get; set; }

    public string DocumentType { get; set; } = string.Empty;

    public string FileUrl { get; set; } = string.Empty;

    public DocumentReviewStatus Status { get; set; }

    public int? ReviewedByAdminId { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public LawyerProfile LawyerProfile { get; set; } = null!;

    public User? ReviewedByAdmin { get; set; }
}
