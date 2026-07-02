using LegalNic.Domain.Common;
using LegalNic.Domain.Enums;

namespace LegalNic.Domain.Entities;

public sealed class Service : AuditableEntity
{
    public int LawyerProfileId { get; set; }

    public int CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal Price { get; set; }

    public PriceType PriceType { get; set; }

    public int EstimatedDays { get; set; }

    public string RequiredDocuments { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public LawyerProfile LawyerProfile { get; set; } = null!;

    public ServiceCategory Category { get; set; } = null!;

    public ICollection<ServiceRequest> ServiceRequests { get; set; } = new List<ServiceRequest>();
}
