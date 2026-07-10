using LegalNic.Domain.Enums;

namespace LegalNic.Application.ServiceRequests;

public sealed class ServiceRequestDetailResponse
{
    public int Id { get; init; }

    public int ServiceId { get; init; }

    public string ServiceName { get; init; } = string.Empty;

    public string CategoryName { get; init; } = string.Empty;

    public int ClientId { get; init; }

    public string ClientName { get; init; } = string.Empty;

    public int LawyerProfileId { get; init; }

    public string LawyerName { get; init; } = string.Empty;

    public ServiceRequestStatus Status { get; init; }

    public string CaseDetail { get; init; } = string.Empty;

    public decimal? AgreedPrice { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? CompletedAt { get; init; }

    public int MessageCount { get; init; }

    public decimal? CommissionAmount { get; init; }

    public decimal? CommissionRate { get; init; }

    public PlatformCommissionStatus? CommissionStatus { get; init; }
}
