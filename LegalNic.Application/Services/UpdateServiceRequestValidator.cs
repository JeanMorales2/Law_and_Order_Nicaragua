using FluentValidation;

namespace LegalNic.Application.Services;

public sealed class UpdateServiceRequestValidator : AbstractValidator<UpdateServiceRequest>
{
    public UpdateServiceRequestValidator()
    {
        RuleFor(request => request.CategoryId)
            .GreaterThan(0);

        RuleFor(request => request.Name)
            .NotEmpty()
            .MaximumLength(150);

        RuleFor(request => request.Description)
            .NotEmpty()
            .MaximumLength(2000);

        RuleFor(request => request.Price)
            .GreaterThanOrEqualTo(0);

        RuleFor(request => request.EstimatedDays)
            .InclusiveBetween(1, 365);

        RuleFor(request => request.RequiredDocuments)
            .NotEmpty()
            .MaximumLength(4000);
    }
}
