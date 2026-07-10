using LegalNic.Domain.Enums;

namespace LegalNic.Application.ServiceRequests;

public sealed class ServiceRequestSummaryResponse
{
    public int Id { get; init; }

    public int ServiceId { get; init; }

    public string ServiceName { get; init; } = string.Empty;

    public string CounterpartyName { get; init; } = string.Empty;

    public ServiceRequestStatus Status { get; init; }

    public string CaseDetail { get; init; } = string.Empty;

    public decimal? AgreedPrice { get; init; }

    public DateTime CreatedAt { get; init; }

    public DateTime? CompletedAt { get; init; }
}
