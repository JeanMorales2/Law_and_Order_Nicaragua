using LegalNic.Application.Admin;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Admin;

public sealed class AdminUserService(LegalNicDbContext dbContext) : IAdminUserService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<IReadOnlyCollection<AdminUserListItemResponse>> GetUsersAsync(
        LegalNic.Domain.Enums.UserRole? role,
        string? search,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.Users.AsNoTracking();

        if (role.HasValue)
        {
            query = query.Where(user => user.Role == role.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(user =>
                user.FullName.Contains(term) ||
                user.Email.Contains(term) ||
                user.PhoneNumber.Contains(term));
        }

        return await query
            .OrderByDescending(user => user.CreatedAt)
            .Select(user => new AdminUserListItemResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                IsActive = user.IsActive,
                IsVerified = user.IsVerified,
                CreatedAt = user.CreatedAt
            })
            .ToArrayAsync(cancellationToken);
    }

    public async Task SuspendAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .SingleOrDefaultAsync(entity => entity.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new KeyNotFoundException("User was not found.");
        }

        if (!user.IsActive)
        {
            return;
        }

        user.IsActive = false;

        var authUser = await _dbContext.Set<ApplicationUser>()
            .SingleOrDefaultAsync(entity => entity.DomainUserId == userId, cancellationToken);

        if (authUser is not null)
        {
            var refreshTokens = await _dbContext.RefreshTokens
                .Where(token => token.ApplicationUserId == authUser.Id && !token.RevokedAtUtc.HasValue)
                .ToArrayAsync(cancellationToken);

            foreach (var refreshToken in refreshTokens)
            {
                refreshToken.RevokedAtUtc = DateTime.UtcNow;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
