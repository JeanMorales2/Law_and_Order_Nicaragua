namespace LegalNic.Application.Categories;

public sealed class CategoryResponse
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public IReadOnlyCollection<CategoryResponse> Subcategories { get; init; } = Array.Empty<CategoryResponse>();
}
