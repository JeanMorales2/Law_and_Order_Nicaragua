using LegalNic.Application.Availability;
using LegalNic.Domain.Entities;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.LawyerAvailability;

public sealed class AvailabilityService(LegalNicDbContext dbContext) : IAvailabilityService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<IReadOnlyCollection<AvailabilityDayResponse>> GetMyAvailabilityAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfileId = await GetOwnedLawyerProfileIdAsync(userId, cancellationToken);

        var availabilities = await _dbContext.Availability
            .AsNoTracking()
            .Where(item => item.LawyerProfileId == lawyerProfileId)
            .OrderBy(item => item.DayOfWeek)
            .Select(item => new AvailabilityDayResponse
            {
                DayOfWeek = item.DayOfWeek,
                IsActive = item.IsActive,
                StartTime = item.StartTime,
                EndTime = item.EndTime
            })
            .ToArrayAsync(cancellationToken);

        if (availabilities.Length == 7)
        {
            return availabilities;
        }

        return BuildDefaultAvailability()
            .GroupJoin(
                availabilities,
                day => day.DayOfWeek,
                existing => existing.DayOfWeek,
                (day, existing) => existing.SingleOrDefault() ?? day)
            .OrderBy(item => item.DayOfWeek)
            .ToArray();
    }

    public async Task<IReadOnlyCollection<AvailabilityDayResponse>> ReplaceMyAvailabilityAsync(
        int userId,
        IReadOnlyCollection<AvailabilityDayRequest> request,
        CancellationToken cancellationToken = default)
    {
        ValidateRequest(request);

        var lawyerProfileId = await GetOwnedLawyerProfileIdAsync(userId, cancellationToken);

        var existing = await _dbContext.Availability
            .Where(item => item.LawyerProfileId == lawyerProfileId)
            .ToArrayAsync(cancellationToken);

        if (existing.Length > 0)
        {
            _dbContext.Availability.RemoveRange(existing);
        }

        var replacement = request
            .OrderBy(item => item.DayOfWeek)
            .Select(item => new Domain.Entities.Availability
            {
                LawyerProfileId = lawyerProfileId,
                DayOfWeek = item.DayOfWeek,
                IsActive = item.IsActive,
                StartTime = item.StartTime,
                EndTime = item.EndTime
            })
            .ToArray();

        _dbContext.Availability.AddRange(replacement);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return replacement
            .Select(item => new AvailabilityDayResponse
            {
                DayOfWeek = item.DayOfWeek,
                IsActive = item.IsActive,
                StartTime = item.StartTime,
                EndTime = item.EndTime
            })
            .ToArray();
    }

    private async Task<int> GetOwnedLawyerProfileIdAsync(int userId, CancellationToken cancellationToken)
    {
        var lawyerProfileId = await _dbContext.LawyerProfiles
            .AsNoTracking()
            .Where(profile => profile.UserId == userId)
            .Select(profile => (int?)profile.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (!lawyerProfileId.HasValue)
        {
            throw new KeyNotFoundException("Lawyer profile for the current user was not found.");
        }

        return lawyerProfileId.Value;
    }

    private static IReadOnlyCollection<AvailabilityDayResponse> BuildDefaultAvailability()
    {
        return Enum.GetValues<DayOfWeek>()
            .OrderBy(day => day)
            .Select(day => new AvailabilityDayResponse
            {
                DayOfWeek = day,
                IsActive = false,
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(17, 0)
            })
            .ToArray();
    }

    private static void ValidateRequest(IReadOnlyCollection<AvailabilityDayRequest> request)
    {
        if (request.Count != 7)
        {
            throw new InvalidOperationException("Availability must include exactly 7 days.");
        }

        if (request.Select(item => item.DayOfWeek).Distinct().Count() != 7)
        {
            throw new InvalidOperationException("Availability must contain each day of week exactly once.");
        }

        if (request.Any(item => item.IsActive && item.EndTime <= item.StartTime))
        {
            throw new InvalidOperationException("EndTime must be greater than StartTime for active days.");
        }
    }
}
