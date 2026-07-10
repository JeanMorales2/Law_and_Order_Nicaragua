using FluentValidation;

namespace LegalNic.Application.ServiceRequests;

public sealed class CompleteServiceRequestRequestValidator : AbstractValidator<CompleteServiceRequestRequest>
{
    public CompleteServiceRequestRequestValidator()
    {
        RuleFor(request => request.AgreedPrice)
            .NotNull()
            .WithMessage("AgreedPrice is required.");

        RuleFor(request => request.AgreedPrice)
            .GreaterThan(0)
            .When(request => request.AgreedPrice.HasValue)
            .WithMessage("AgreedPrice must be greater than zero.");
    }
}
