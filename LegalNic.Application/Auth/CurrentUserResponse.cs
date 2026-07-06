using LegalNic.Domain.Enums;

namespace LegalNic.Application.Auth;

public sealed class CurrentUserResponse
{
    public int Id { get; init; }

    public string FullName { get; init; } = string.Empty;

    public string Email { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;

    public UserRole Role { get; init; }

    public bool IsVerified { get; init; }

    public CurrentLawyerProfileResponse? LawyerProfile { get; init; }
}
