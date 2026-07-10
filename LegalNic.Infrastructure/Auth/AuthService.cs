using LegalNic.Application.Auth;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Auth;

public sealed class AuthService(
    LegalNicDbContext dbContext,
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService) : IAuthService
{
    private readonly LegalNicDbContext _dbContext = dbContext;
    private readonly UserManager<ApplicationUser> _userManager = userManager;
    private readonly ITokenService _tokenService = tokenService;

    public async Task RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _dbContext.Users.AnyAsync(user => user.Email == normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PhoneNumber = request.PhoneNumber.Trim(),
            Role = request.Role,
            IsActive = true,
            IsVerified = request.Role == UserRole.Citizen
        };

        if (request.Role is UserRole.Lawyer or UserRole.Student)
        {
            var lawyerProfile = request.LawyerProfile!;

            user.LawyerProfile = new LawyerProfile
            {
                BarNumber = lawyerProfile.BarNumber.Trim(),
                University = lawyerProfile.University.Trim(),
                IsStudent = request.Role == UserRole.Student,
                YearsExperience = lawyerProfile.YearsExperience,
                Bio = lawyerProfile.Bio.Trim(),
                Department = lawyerProfile.Department.Trim(),
                Municipality = lawyerProfile.Municipality.Trim(),
                VerificationStatus = VerificationStatus.Pending
            };
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var applicationUser = new ApplicationUser
        {
            DomainUserId = user.Id,
            Email = normalizedEmail,
            UserName = normalizedEmail,
            NormalizedEmail = normalizedEmail.ToUpperInvariant(),
            NormalizedUserName = normalizedEmail.ToUpperInvariant(),
            PhoneNumber = request.PhoneNumber.Trim(),
            EmailConfirmed = true,
            PhoneNumberConfirmed = false
        };

        var createResult = await _userManager.CreateAsync(applicationUser, request.Password);

        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join(" ", createResult.Errors.Select(error => error.Description)));
        }

        var roleResult = await _userManager.AddToRoleAsync(applicationUser, request.Role.ToString());

        if (!roleResult.Succeeded)
        {
            throw new InvalidOperationException(
                string.Join(" ", roleResult.Errors.Select(error => error.Description)));
        }

        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var applicationUser = await _userManager.FindByEmailAsync(normalizedEmail);

        if (applicationUser is null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        var userIsActive = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == applicationUser.DomainUserId)
            .Select(user => (bool?)user.IsActive)
            .SingleOrDefaultAsync(cancellationToken);

        if (userIsActive != true)
        {
            throw new UnauthorizedAccessException("This account is suspended.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(applicationUser, request.Password);

        if (!passwordValid)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return await _tokenService.CreateTokensAsync(applicationUser, cancellationToken);
    }

    public async Task<AuthResponse> RefreshTokenAsync(
        RefreshTokenRequest request,
        CancellationToken cancellationToken = default)
    {
        var refreshTokenHash = _tokenService.ComputeRefreshTokenHash(request.RefreshToken.Trim());
        var storedToken = await _dbContext.RefreshTokens
            .Include(token => token.ApplicationUser)
            .SingleOrDefaultAsync(token => token.TokenHash == refreshTokenHash, cancellationToken);

        if (storedToken is null || storedToken.RevokedAtUtc.HasValue || storedToken.ExpiresAtUtc <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        var userIsActive = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == storedToken.ApplicationUser.DomainUserId)
            .Select(user => (bool?)user.IsActive)
            .SingleOrDefaultAsync(cancellationToken);

        if (userIsActive != true)
        {
            throw new UnauthorizedAccessException("This account is suspended.");
        }

        storedToken.RevokedAtUtc = DateTime.UtcNow;
        var newTokens = await _tokenService.CreateTokensAsync(storedToken.ApplicationUser, cancellationToken);
        storedToken.ReplacedByTokenHash = _tokenService.ComputeRefreshTokenHash(newTokens.RefreshToken);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return newTokens;
    }
}
