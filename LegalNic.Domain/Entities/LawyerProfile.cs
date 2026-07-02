using LegalNic.Domain.Common;
using LegalNic.Domain.Enums;

namespace LegalNic.Domain.Entities;

public sealed class LawyerProfile : AuditableEntity
{
    public int UserId { get; set; }

    public string BarNumber { get; set; } = string.Empty;

    public string University { get; set; } = string.Empty;

    public bool IsStudent { get; set; }

    public int YearsExperience { get; set; }

    public string Bio { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Municipality { get; set; } = string.Empty;

    public VerificationStatus VerificationStatus { get; set; }

    public User User { get; set; } = null!;

    public ICollection<Service> Services { get; set; } = new List<Service>();

    public ICollection<VerificationDocument> VerificationDocuments { get; set; } =
        new List<VerificationDocument>();

    public ICollection<Availability> Availabilities { get; set; } = new List<Availability>();

    public ICollection<PlatformCommission> PlatformCommissions { get; set; } =
        new List<PlatformCommission>();
}
