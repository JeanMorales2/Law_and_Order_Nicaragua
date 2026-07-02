using LegalNic.Domain.Common;
using LegalNic.Domain.Enums;

namespace LegalNic.Domain.Entities;

public sealed class PlatformCommission : AuditableEntity
{
    public int ServiceRequestId { get; set; }

    public int LawyerProfileId { get; set; }

    public decimal AgreedPrice { get; set; }

    public decimal CommissionRate { get; set; }

    public decimal CommissionAmount { get; set; }

    public PlatformCommissionStatus Status { get; set; }

    public DateTime? SettledAt { get; set; }

    public ServiceRequest ServiceRequest { get; set; } = null!;

    public LawyerProfile LawyerProfile { get; set; } = null!;
}
