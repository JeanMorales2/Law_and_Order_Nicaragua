namespace LegalNic.Application.Reviews;

public sealed class ReviewResponse
{
    public int Id { get; init; }

    public int ServiceRequestId { get; init; }

    public int Rating { get; init; }

    public string Comment { get; init; } = string.Empty;

    public DateTime CreatedAt { get; init; }
}
