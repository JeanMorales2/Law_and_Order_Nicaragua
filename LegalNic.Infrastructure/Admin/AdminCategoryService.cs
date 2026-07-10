using LegalNic.Application.Admin;
using LegalNic.Application.Common;
using LegalNic.Domain.Entities;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Admin;

public sealed class AdminCategoryService(LegalNicDbContext dbContext) : IAdminCategoryService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<IReadOnlyCollection<AdminCategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.ServiceCategories
            .AsNoTracking()
            .OrderBy(category => category.Name)
            .Select(category => new AdminCategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ParentCategoryId = category.ParentCategoryId
            })
            .ToArrayAsync(cancellationToken);
    }

    public async Task<AdminCategoryResponse> CreateAsync(
        AdminCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureNameAvailableAsync(request.Name, excludingCategoryId: null, cancellationToken);
        await EnsureParentExistsAsync(request.ParentCategoryId, cancellationToken);

        var category = new ServiceCategory
        {
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            ParentCategoryId = request.ParentCategoryId
        };

        _dbContext.ServiceCategories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task<AdminCategoryResponse> UpdateAsync(
        int categoryId,
        AdminCategoryRequest request,
        CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.ServiceCategories
            .SingleOrDefaultAsync(entity => entity.Id == categoryId, cancellationToken);

        if (category is null)
        {
            throw new KeyNotFoundException("Service category was not found.");
        }

        if (request.ParentCategoryId == categoryId)
        {
            throw new InvalidOperationException("A category cannot be its own parent.");
        }

        await EnsureNameAvailableAsync(request.Name, categoryId, cancellationToken);
        await EnsureParentExistsAsync(request.ParentCategoryId, cancellationToken);

        category.Name = request.Name.Trim();
        category.Description = request.Description.Trim();
        category.ParentCategoryId = request.ParentCategoryId;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return ToResponse(category);
    }

    public async Task DeleteAsync(int categoryId, CancellationToken cancellationToken = default)
    {
        var category = await _dbContext.ServiceCategories
            .Include(entity => entity.ChildCategories)
            .Include(entity => entity.Services)
            .SingleOrDefaultAsync(entity => entity.Id == categoryId, cancellationToken);

        if (category is null)
        {
            throw new KeyNotFoundException("Service category was not found.");
        }

        if (category.ChildCategories.Any())
        {
            throw new InvalidOperationException("Cannot delete a category that still has subcategories.");
        }

        if (category.Services.Any())
        {
            throw new InvalidOperationException("Cannot delete a category that is assigned to services.");
        }

        _dbContext.ServiceCategories.Remove(category);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureNameAvailableAsync(
        string name,
        int? excludingCategoryId,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim();

        var exists = await _dbContext.ServiceCategories
            .AsNoTracking()
            .AnyAsync(category =>
                category.Name == normalizedName
                && (!excludingCategoryId.HasValue || category.Id != excludingCategoryId.Value),
                cancellationToken);

        if (exists)
        {
            throw new ConflictException("A service category with this name already exists.");
        }
    }

    private async Task EnsureParentExistsAsync(int? parentCategoryId, CancellationToken cancellationToken)
    {
        if (!parentCategoryId.HasValue)
        {
            return;
        }

        var exists = await _dbContext.ServiceCategories
            .AsNoTracking()
            .AnyAsync(category => category.Id == parentCategoryId.Value, cancellationToken);

        if (!exists)
        {
            throw new KeyNotFoundException("Parent service category was not found.");
        }
    }

    private static AdminCategoryResponse ToResponse(ServiceCategory category)
    {
        return new AdminCategoryResponse
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            ParentCategoryId = category.ParentCategoryId
        };
    }
}
