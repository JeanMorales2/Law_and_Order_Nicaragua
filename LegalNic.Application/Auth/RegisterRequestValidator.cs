using FluentValidation;
using LegalNic.Domain.Enums;

namespace LegalNic.Application.Auth;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.FullName)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(request => request.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(request => request.PhoneNumber)
            .NotEmpty()
            .MaximumLength(30);

        RuleFor(request => request.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");

        RuleFor(request => request.Role)
            .IsInEnum()
            .Must(role => role != UserRole.Admin)
            .WithMessage("Admin registrations are not allowed through this endpoint.");

        When(
            request => request.Role is UserRole.Lawyer or UserRole.Student,
            () =>
            {
                RuleFor(request => request.LawyerProfile!)
                    .NotNull()
                    .SetValidator(new RegisterLawyerProfileRequestValidator());
            });

        When(
            request => request.Role == UserRole.Citizen,
            () =>
            {
                RuleFor(request => request.LawyerProfile)
                    .Null()
                    .WithMessage("LawyerProfile is only allowed for Lawyer or Student registrations.");
            });
    }
}
