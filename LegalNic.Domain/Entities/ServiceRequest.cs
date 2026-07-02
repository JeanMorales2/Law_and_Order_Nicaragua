using LegalNic.Domain.Common;
using LegalNic.Domain.Enums;

namespace LegalNic.Domain.Entities;

public sealed class ServiceRequest : AuditableEntity
{
    public int ServiceId { get; set; }

    public int ClientId { get; set; }

    public decimal? AgreedPrice { get; set; }

    public ServiceRequestStatus Status { get; set; }

    public string CaseDetail { get; set; } = string.Empty;

    public DateTime? CompletedAt { get; set; }

    public Service Service { get; set; } = null!;

    public User Client { get; set; } = null!;

    public ICollection<Message> Messages { get; set; } = new List<Message>();

    public Review? Review { get; set; }

    public PlatformCommission? PlatformCommission { get; set; }
}
