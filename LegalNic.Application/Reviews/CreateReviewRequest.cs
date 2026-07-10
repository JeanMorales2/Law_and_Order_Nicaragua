namespace LegalNic.Application.Reviews;

public sealed class CreateReviewRequest
{
    public int Rating { get; init; }

    public string Comment { get; init; } = string.Empty;
}
