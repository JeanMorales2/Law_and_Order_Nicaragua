using FluentValidation;

namespace LegalNic.Application.ServiceRequests;

public sealed class CreateServiceRequestRequestValidator : AbstractValidator<CreateServiceRequestRequest>
{
    public CreateServiceRequestRequestValidator()
    {
        RuleFor(request => request.ServiceId)
            .GreaterThan(0);

        RuleFor(request => request.CaseDetail)
            .NotEmpty()
            .MaximumLength(4000);
    }
}
