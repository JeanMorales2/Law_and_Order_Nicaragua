using FluentValidation;

namespace LegalNic.Application.Admin;

public sealed class AdminCategoryRequestValidator : AbstractValidator<AdminCategoryRequest>
{
    public AdminCategoryRequestValidator()
    {
        RuleFor(request => request.Name)
            .NotEmpty()
            .MaximumLength(120);

        RuleFor(request => request.Description)
            .NotEmpty()
            .MaximumLength(500);
    }
}
