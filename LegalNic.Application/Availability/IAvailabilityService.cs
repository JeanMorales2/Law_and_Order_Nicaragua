namespace LegalNic.Application.Availability;

public interface IAvailabilityService
{
    Task<IReadOnlyCollection<AvailabilityDayResponse>> GetMyAvailabilityAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<AvailabilityDayResponse>> ReplaceMyAvailabilityAsync(
        int userId,
        IReadOnlyCollection<AvailabilityDayRequest> request,
        CancellationToken cancellationToken = default);
}
