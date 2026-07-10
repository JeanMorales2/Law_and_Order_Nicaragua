namespace LegalNic.Application.Services;

public sealed class SearchServicesRequest
{
    public string? Query { get; init; }

    public int? CategoryId { get; init; }

    public string? City { get; init; }

    public decimal? PriceMin { get; init; }

    public decimal? PriceMax { get; init; }

    public decimal? MinRating { get; init; }

    public bool? OnlyVerified { get; init; }

    public string? SortBy { get; init; }

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 10;
}
