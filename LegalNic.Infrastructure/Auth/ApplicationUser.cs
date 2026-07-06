using Microsoft.AspNetCore.Identity;

namespace LegalNic.Infrastructure.Auth;

public sealed class ApplicationUser : IdentityUser<int>
{
    public int DomainUserId { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
