using LegalNic.Domain.Common;

namespace LegalNic.Domain.Entities;

public sealed class Availability : AuditableEntity
{
    public int LawyerProfileId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public bool IsActive { get; set; }

    public TimeOnly StartTime { get; set; }

    public TimeOnly EndTime { get; set; }

    public LawyerProfile LawyerProfile { get; set; } = null!;
}
