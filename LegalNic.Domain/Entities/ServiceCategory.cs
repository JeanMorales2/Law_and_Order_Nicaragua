using LegalNic.Domain.Common;

namespace LegalNic.Domain.Entities;

public sealed class ServiceCategory : AuditableEntity
{
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int? ParentCategoryId { get; set; }

    public ServiceCategory? ParentCategory { get; set; }

    public ICollection<ServiceCategory> ChildCategories { get; set; } = new List<ServiceCategory>();

    public ICollection<Service> Services { get; set; } = new List<Service>();
}
