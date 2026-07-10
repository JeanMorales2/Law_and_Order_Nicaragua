namespace LegalNic.Infrastructure.Reviews;

internal sealed class LawyerReviewSummaryProjection
{
    public int LawyerProfileId { get; init; }

    public decimal? AverageRating { get; init; }

    public int ReviewCount { get; init; }
}
