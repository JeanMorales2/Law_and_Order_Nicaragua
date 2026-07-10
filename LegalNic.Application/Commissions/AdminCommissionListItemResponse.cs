using LegalNic.Domain.Enums;

namespace LegalNic.Application.Commissions;

public sealed class AdminCommissionListItemResponse
{
    public int Id { get; init; }

    public int LawyerProfileId { get; init; }

    public string LawyerName { get; init; } = string.Empty;

    public int ServiceRequestId { get; init; }

    public string ServiceName { get; init; } = string.Empty;

    public string ClientName { get; init; } = string.Empty;

    public decimal AgreedPrice { get; init; }

    public decimal CommissionAmount { get; init; }

    public decimal CommissionRate { get; init; }

    public PlatformCommissionStatus Status { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? SettledAt { get; init; }
}
