namespace LegalNic.Application.Auth;

public sealed class RegisterDeviceTokenRequest
{
    public string DeviceToken { get; init; } = string.Empty;

    public string Platform { get; init; } = string.Empty;
}
