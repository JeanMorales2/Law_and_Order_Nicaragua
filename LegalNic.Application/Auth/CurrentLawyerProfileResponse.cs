using LegalNic.Domain.Enums;

namespace LegalNic.Application.Auth;

public sealed class CurrentLawyerProfileResponse
{
    public int Id { get; init; }

    public string BarNumber { get; init; } = string.Empty;

    public string University { get; init; } = string.Empty;

    public bool IsStudent { get; init; }

    public int YearsExperience { get; init; }

    public string Bio { get; init; } = string.Empty;

    public string Department { get; init; } = string.Empty;

    public string Municipality { get; init; } = string.Empty;

    public VerificationStatus VerificationStatus { get; init; }
}
