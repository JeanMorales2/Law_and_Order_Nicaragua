using LegalNic.Domain.Enums;

namespace LegalNic.Application.Lawyers;

public sealed class PublicLawyerProfileResponse
{
    public int Id { get; init; }

    public int UserId { get; init; }

    public string FullName { get; init; } = string.Empty;

    public string University { get; init; } = string.Empty;

    public bool IsStudent { get; init; }

    public int YearsExperience { get; init; }

    public string Bio { get; init; } = string.Empty;

    public string Department { get; init; } = string.Empty;

    public string Municipality { get; init; } = string.Empty;

    public VerificationStatus VerificationStatus { get; init; }

    public bool IsVerified { get; init; }

    public decimal? AverageRating { get; init; }

    public IReadOnlyCollection<PublicLawyerServiceResponse> ActiveServices { get; init; } =
        Array.Empty<PublicLawyerServiceResponse>();
}
