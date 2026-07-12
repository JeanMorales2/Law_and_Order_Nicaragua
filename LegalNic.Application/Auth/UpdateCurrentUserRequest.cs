namespace LegalNic.Application.Auth;

public sealed class UpdateCurrentUserRequest
{
    public string FullName { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;
}
