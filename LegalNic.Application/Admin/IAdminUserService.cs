using LegalNic.Domain.Enums;

namespace LegalNic.Application.Admin;

public interface IAdminUserService
{
    Task<IReadOnlyCollection<AdminUserListItemResponse>> GetUsersAsync(
        UserRole? role,
        string? search,
        CancellationToken cancellationToken = default);

    Task SuspendAsync(int userId, CancellationToken cancellationToken = default);
}
