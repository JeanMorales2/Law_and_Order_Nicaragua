using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using LegalNic.Application.Auth;
using LegalNic.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LegalNic.Infrastructure.Auth;

public sealed class TokenService(
    IOptions<AuthOptions> authOptions,
    LegalNicDbContext dbContext,
    UserManager<ApplicationUser> userManager) : ITokenService
{
    private readonly AuthOptions _authOptions = authOptions.Value;
    private readonly LegalNicDbContext _dbContext = dbContext;
    private readonly UserManager<ApplicationUser> _userManager = userManager;

    public async Task<AuthResponse> CreateTokensAsync(
        ApplicationUser applicationUser,
        CancellationToken cancellationToken = default)
    {
        var roles = await _userManager.GetRolesAsync(applicationUser);
        var now = DateTime.UtcNow;
        var accessTokenExpiresAtUtc = now.AddMinutes(_authOptions.AccessTokenMinutes);
        var refreshTokenExpiresAtUtc = now.AddDays(_authOptions.RefreshTokenDays);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, applicationUser.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, applicationUser.Email ?? string.Empty),
            new("legalnic_user_id", applicationUser.DomainUserId.ToString()),
            new(ClaimTypes.Name, applicationUser.UserName ?? applicationUser.Email ?? string.Empty)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_authOptions.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var jwtToken = new JwtSecurityToken(
            issuer: _authOptions.Issuer,
            audience: _authOptions.Audience,
            claims: claims,
            notBefore: now,
            expires: accessTokenExpiresAtUtc,
            signingCredentials: credentials);

        var refreshToken = GenerateRefreshToken();
        var refreshTokenHash = ComputeRefreshTokenHash(refreshToken);

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            ApplicationUserId = applicationUser.Id,
            TokenHash = refreshTokenHash,
            CreatedAtUtc = now,
            ExpiresAtUtc = refreshTokenExpiresAtUtc
        });

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(jwtToken),
            accessTokenExpiresAtUtc,
            refreshToken,
            refreshTokenExpiresAtUtc);
    }

    public string ComputeRefreshTokenHash(string refreshToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToHexString(bytes);
    }

    private static string GenerateRefreshToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
}
