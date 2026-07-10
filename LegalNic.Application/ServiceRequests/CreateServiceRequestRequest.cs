namespace LegalNic.Application.ServiceRequests;

public sealed class CreateServiceRequestRequest
{
    public int ServiceId { get; init; }

    public string CaseDetail { get; init; } = string.Empty;
}
