namespace LegalNic.Application.Admin;

public interface IAdminCategoryService
{
    Task<IReadOnlyCollection<AdminCategoryResponse>> GetAllAsync(CancellationToken cancellationToken = default);

    Task<AdminCategoryResponse> CreateAsync(
        AdminCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminCategoryResponse> UpdateAsync(
        int categoryId,
        AdminCategoryRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(int categoryId, CancellationToken cancellationToken = default);
}
