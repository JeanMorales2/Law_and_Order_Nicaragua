namespace LegalNic.Application.Reviews;

public sealed class LawyerReviewsResponse
{
    public required IReadOnlyCollection<LawyerReviewItemResponse> Items { get; init; }

    public required int Page { get; init; }

    public required int PageSize { get; init; }

    public required int TotalCount { get; init; }

    public decimal? AverageRating { get; init; }

    public int TotalPages => TotalCount == 0
        ? 0
        : (int)Math.Ceiling(TotalCount / (double)PageSize);
}
