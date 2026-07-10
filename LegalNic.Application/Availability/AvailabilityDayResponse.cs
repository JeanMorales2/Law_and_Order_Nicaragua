namespace LegalNic.Application.Availability;

public sealed class AvailabilityDayResponse
{
    public DayOfWeek DayOfWeek { get; init; }

    public bool IsActive { get; init; }

    public TimeOnly StartTime { get; init; }

    public TimeOnly EndTime { get; init; }
}
