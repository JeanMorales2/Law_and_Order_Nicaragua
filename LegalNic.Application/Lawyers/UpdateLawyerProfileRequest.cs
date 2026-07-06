namespace LegalNic.Application.Lawyers;

public sealed class UpdateLawyerProfileRequest
{
    public string Bio { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Municipality { get; set; } = string.Empty;

    public int YearsExperience { get; set; }
}
