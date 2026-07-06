using LegalNic.Domain.Enums;

namespace LegalNic.Application.Auth;

public sealed class RegisterRequest
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public RegisterLawyerProfileRequest? LawyerProfile { get; set; }
}
