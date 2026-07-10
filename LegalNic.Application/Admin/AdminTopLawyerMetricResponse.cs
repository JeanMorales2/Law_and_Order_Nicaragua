namespace LegalNic.Application.Admin;

public sealed class AdminTopLawyerMetricResponse
{
    public int LawyerProfileId { get; init; }

    public int UserId { get; init; }

    public string FullName { get; init; } = string.Empty;

    public decimal AverageRating { get; init; }

    public int ReviewCount { get; init; }
}
