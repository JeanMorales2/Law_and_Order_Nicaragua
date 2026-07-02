using LegalNic.Domain.Common;

namespace LegalNic.Domain.Entities;

public sealed class Review : AuditableEntity
{
    public int ServiceRequestId { get; set; }

    public int Rating { get; set; }

    public string Comment { get; set; } = string.Empty;

    public ServiceRequest ServiceRequest { get; set; } = null!;
}
