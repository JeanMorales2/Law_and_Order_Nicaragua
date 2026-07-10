using LegalNic.Application.Categories;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Categories;

public sealed class CategoryService(LegalNicDbContext dbContext) : ICategoryService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<IReadOnlyCollection<CategoryResponse>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var categories = await _dbContext.ServiceCategories
            .AsNoTracking()
            .Where(category => category.ParentCategoryId == null)
            .OrderBy(category => category.Name)
            .Select(category => new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Subcategories = category.ChildCategories
                    .OrderBy(child => child.Name)
                    .Select(child => new CategoryResponse
                    {
                        Id = child.Id,
                        Name = child.Name,
                        Description = child.Description,
                        Subcategories = Array.Empty<CategoryResponse>()
                    })
                    .ToArray()
            })
            .ToArrayAsync(cancellationToken);

        return categories;
    }
}
