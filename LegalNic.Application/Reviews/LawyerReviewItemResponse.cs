namespace LegalNic.Application.Reviews;

public sealed class LawyerReviewItemResponse
{
    public int Id { get; init; }

    public int ServiceRequestId { get; init; }

    public int ClientId { get; init; }

    public string ClientName { get; init; } = string.Empty;

    public int Rating { get; init; }

    public string Comment { get; init; } = string.Empty;

    public DateTime CreatedAt { get; init; }
}
