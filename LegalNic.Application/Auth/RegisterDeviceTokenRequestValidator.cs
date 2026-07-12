using FluentValidation;

namespace LegalNic.Application.Auth;

public sealed class RegisterDeviceTokenRequestValidator : AbstractValidator<RegisterDeviceTokenRequest>
{
    public RegisterDeviceTokenRequestValidator()
    {
        RuleFor(request => request.DeviceToken)
            .NotEmpty()
            .MaximumLength(512);

        RuleFor(request => request.Platform)
            .NotEmpty()
            .MaximumLength(30);
    }
}
