using FluentValidation;

namespace LegalNic.Application.Lawyers;

public sealed class UpdateLawyerProfileRequestValidator : AbstractValidator<UpdateLawyerProfileRequest>
{
    public UpdateLawyerProfileRequestValidator()
    {
        RuleFor(request => request.Bio)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(request => request.Department)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.Municipality)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.YearsExperience)
            .InclusiveBetween(0, 60);
    }
}
