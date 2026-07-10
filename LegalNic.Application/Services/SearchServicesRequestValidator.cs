using FluentValidation;

namespace LegalNic.Application.Services;

public sealed class SearchServicesRequestValidator : AbstractValidator<SearchServicesRequest>
{
    private static readonly string[] AllowedSortValues = ["rating", "price", "recent"];

    public SearchServicesRequestValidator()
    {
        RuleFor(request => request.CategoryId)
            .GreaterThan(0)
            .When(request => request.CategoryId.HasValue);

        RuleFor(request => request.PriceMin)
            .GreaterThanOrEqualTo(0)
            .When(request => request.PriceMin.HasValue);

        RuleFor(request => request.PriceMax)
            .GreaterThanOrEqualTo(0)
            .When(request => request.PriceMax.HasValue);

        RuleFor(request => request)
            .Must(request => !request.PriceMin.HasValue
                || !request.PriceMax.HasValue
                || request.PriceMin.Value <= request.PriceMax.Value)
            .WithMessage("PriceMin must be less than or equal to PriceMax.");

        RuleFor(request => request.MinRating)
            .InclusiveBetween(1, 5)
            .When(request => request.MinRating.HasValue);

        RuleFor(request => request.SortBy)
            .Must(sortBy => string.IsNullOrWhiteSpace(sortBy)
                || AllowedSortValues.Contains(sortBy.Trim(), StringComparer.OrdinalIgnoreCase))
            .WithMessage("SortBy must be one of: rating, price, recent.");

        RuleFor(request => request.Page)
            .GreaterThan(0);

        RuleFor(request => request.PageSize)
            .InclusiveBetween(1, 50);
    }
}
