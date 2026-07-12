using LegalNic.Application.Auth;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Auth;

public sealed class CurrentUserService(LegalNicDbContext dbContext) : ICurrentUserService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<CurrentUserResponse> GetCurrentUserAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .AsNoTracking()
            .Include(entity => entity.LawyerProfile)
            .SingleOrDefaultAsync(entity => entity.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException("Authenticated user was not found.");
        }

        return new CurrentUserResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Role = user.Role,
            IsActive = user.IsActive,
            IsVerified = user.IsVerified,
            LawyerProfile = user.LawyerProfile is null
                ? null
                : new CurrentLawyerProfileResponse
                {
                    Id = user.LawyerProfile.Id,
                    BarNumber = user.LawyerProfile.BarNumber,
                    University = user.LawyerProfile.University,
                    IsStudent = user.LawyerProfile.IsStudent,
                    YearsExperience = user.LawyerProfile.YearsExperience,
                    Bio = user.LawyerProfile.Bio,
                    Department = user.LawyerProfile.Department,
                    Municipality = user.LawyerProfile.Municipality,
                    VerificationStatus = user.LawyerProfile.VerificationStatus
            }
        };
    }

    public async Task<CurrentUserResponse> UpdateCurrentUserAsync(
        int userId,
        UpdateCurrentUserRequest request,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.Users
            .SingleOrDefaultAsync(entity => entity.Id == userId, cancellationToken);

        if (user is null)
        {
            throw new UnauthorizedAccessException("Authenticated user was not found.");
        }

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();

        var authUser = await _dbContext.Set<ApplicationUser>()
            .SingleOrDefaultAsync(entity => entity.DomainUserId == userId, cancellationToken);

        if (authUser is not null)
        {
            authUser.PhoneNumber = user.PhoneNumber;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetCurrentUserAsync(userId, cancellationToken);
    }
}
