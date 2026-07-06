namespace LegalNic.Infrastructure.Auth;

public sealed class RefreshToken
{
    public int Id { get; set; }

    public int ApplicationUserId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? RevokedAtUtc { get; set; }

    public string? ReplacedByTokenHash { get; set; }

    public ApplicationUser ApplicationUser { get; set; } = null!;
}
