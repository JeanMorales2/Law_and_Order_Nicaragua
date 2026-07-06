using FluentValidation;

namespace LegalNic.Application.Auth;

public sealed class RegisterLawyerProfileRequestValidator : AbstractValidator<RegisterLawyerProfileRequest>
{
    public RegisterLawyerProfileRequestValidator()
    {
        RuleFor(request => request.BarNumber)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(request => request.University)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(request => request.YearsExperience)
            .InclusiveBetween(0, 60);

        RuleFor(request => request.Bio)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(request => request.Department)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.Municipality)
            .NotEmpty()
            .MaximumLength(100);
    }
}
