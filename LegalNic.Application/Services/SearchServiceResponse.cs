namespace LegalNic.Application.Services;

public sealed class SearchServiceResponse
{
    public int ServiceId { get; init; }

    public int LawyerProfileId { get; init; }

    public string LawyerName { get; init; } = string.Empty;

    public string? LawyerPhotoUrl { get; init; }

    public string ServiceName { get; init; } = string.Empty;

    public decimal Price { get; init; }

    public int EstimatedDays { get; init; }

    public decimal? AverageRating { get; init; }

    public int ReviewCount { get; init; }

    public string City { get; init; } = string.Empty;

    public bool IsVerified { get; init; }

    public bool IsStudent { get; init; }
}
