namespace LegalNic.Application.Admin;

public sealed class AdminCategoryResponse
{
    public int Id { get; init; }

    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    public int? ParentCategoryId { get; init; }
}
