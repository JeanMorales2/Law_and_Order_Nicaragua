using FluentValidation;

namespace LegalNic.Application.Availability;

public sealed class ReplaceAvailabilityRequestValidator : AbstractValidator<IReadOnlyCollection<AvailabilityDayRequest>>
{
    public ReplaceAvailabilityRequestValidator()
    {
        RuleFor(request => request)
            .NotNull()
            .Must(request => request.Count == 7)
            .WithMessage("Availability must include exactly 7 days.");

        RuleFor(request => request)
            .Must(request => request.Select(item => item.DayOfWeek).Distinct().Count() == 7)
            .WithMessage("Availability must contain each day of week exactly once.");

        RuleForEach(request => request)
            .ChildRules(day =>
            {
                day.RuleFor(item => item)
                    .Must(item => !item.IsActive || item.EndTime > item.StartTime)
                    .WithMessage("EndTime must be greater than StartTime for active days.");
            });
    }
}
