using LegalNic.Domain.Enums;

namespace LegalNic.Application.Services;

public sealed class UpdateServiceRequest
{
    public int CategoryId { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public decimal Price { get; init; }

    public PriceType PriceType { get; init; }

    public int EstimatedDays { get; init; }

    public string RequiredDocuments { get; init; } = string.Empty;

    public bool IsActive { get; init; } = true;
}
