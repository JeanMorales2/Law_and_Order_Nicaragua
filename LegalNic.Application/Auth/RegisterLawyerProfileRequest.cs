namespace LegalNic.Application.Auth;

public sealed class RegisterLawyerProfileRequest
{
    public string BarNumber { get; set; } = string.Empty;

    public string University { get; set; } = string.Empty;

    public int YearsExperience { get; set; }

    public string Bio { get; set; } = string.Empty;

    public string Department { get; set; } = string.Empty;

    public string Municipality { get; set; } = string.Empty;
}
