using LegalNic.Application.Auth;

namespace LegalNic.Infrastructure.Auth;

public interface ITokenService
{
    Task<AuthResponse> CreateTokensAsync(
        ApplicationUser applicationUser,
        CancellationToken cancellationToken = default);

    string ComputeRefreshTokenHash(string refreshToken);
}
