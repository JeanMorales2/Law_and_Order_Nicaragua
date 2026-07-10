using FluentValidation;

namespace LegalNic.Application.Reviews;

public sealed class CreateReviewRequestValidator : AbstractValidator<CreateReviewRequest>
{
    public CreateReviewRequestValidator()
    {
        RuleFor(request => request.Rating)
            .InclusiveBetween(1, 5);

        RuleFor(request => request.Comment)
            .NotEmpty()
            .MaximumLength(2000);
    }
}
