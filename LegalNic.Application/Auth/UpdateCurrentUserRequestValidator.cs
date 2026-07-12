using FluentValidation;

namespace LegalNic.Application.Auth;

public sealed class UpdateCurrentUserRequestValidator : AbstractValidator<UpdateCurrentUserRequest>
{
    public UpdateCurrentUserRequestValidator()
    {
        RuleFor(request => request.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(request => request.PhoneNumber)
            .NotEmpty()
            .MaximumLength(30);
    }
}
