using LegalNic.Application.Admin;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Reviews;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Admin;

public sealed class AdminMetricsService(LegalNicDbContext dbContext) : IAdminMetricsService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<AdminMetricsResponse> GetAsync(CancellationToken cancellationToken = default)
    {
        var usersByRole = await _dbContext.Users
            .AsNoTracking()
            .GroupBy(user => user.Role)
            .Select(group => new AdminMetricCountResponse
            {
                Key = group.Key.ToString(),
                Count = group.Count()
            })
            .ToArrayAsync(cancellationToken);

        var requestsByStatus = await _dbContext.ServiceRequests
            .AsNoTracking()
            .GroupBy(request => request.Status)
            .Select(group => new AdminMetricCountResponse
            {
                Key = group.Key.ToString(),
                Count = group.Count()
            })
            .ToArrayAsync(cancellationToken);

        var reviewSummaryQuery = _dbContext.BuildLawyerReviewSummaryQuery();
        var topLawyers = await _dbContext.LawyerProfiles
            .AsNoTracking()
            .GroupJoin(
                reviewSummaryQuery,
                profile => profile.Id,
                summary => summary.LawyerProfileId,
                (profile, summaries) => new
                {
                    Profile = profile,
                    Summary = summaries.SingleOrDefault()
                })
            .Where(entity => entity.Summary != null && entity.Summary.ReviewCount > 0)
            .OrderByDescending(entity => entity.Summary!.AverageRating ?? 0)
            .ThenByDescending(entity => entity.Summary!.ReviewCount)
            .Take(5)
            .Select(entity => new AdminTopLawyerMetricResponse
            {
                LawyerProfileId = entity.Profile.Id,
                UserId = entity.Profile.UserId,
                FullName = entity.Profile.User.FullName,
                AverageRating = Math.Round(entity.Summary!.AverageRating!.Value, 2, MidpointRounding.AwayFromZero),
                ReviewCount = entity.Summary.ReviewCount
            })
            .ToArrayAsync(cancellationToken);

        var weekStarts = Enumerable.Range(0, 8)
            .Select(offset => StartOfWeek(DateTime.UtcNow.Date).AddDays(-7 * (7 - offset)))
            .ToArray();

        var requestRows = await _dbContext.ServiceRequests
            .AsNoTracking()
            .Where(request => request.CreatedAt >= weekStarts[0])
            .Select(request => request.CreatedAt)
            .ToArrayAsync(cancellationToken);

        var requestsByWeek = weekStarts
            .Select(start => new AdminMetricTimeSeriesResponse
            {
                PeriodStart = DateOnly.FromDateTime(start),
                PeriodLabel = $"{start:yyyy-MM-dd}",
                Count = requestRows.Count(createdAt =>
                {
                    var created = createdAt.Date;
                    return created >= start && created < start.AddDays(7);
                })
            })
            .ToArray();

        var now = DateTime.UtcNow;
        var monthStarts = Enumerable.Range(0, 6)
            .Select(offset =>
            {
                var month = new DateTime(now.Year, now.Month, 1).AddMonths(-(5 - offset));
                return month;
            })
            .ToArray();

        var commissionRows = await _dbContext.PlatformCommissions
            .AsNoTracking()
            .Where(commission =>
                commission.CreatedAt >= monthStarts[0] ||
                (commission.SettledAt.HasValue && commission.SettledAt.Value >= monthStarts[0]))
            .Select(commission => new
            {
                commission.CommissionAmount,
                commission.Status,
                commission.CreatedAt,
                commission.SettledAt
            })
            .ToArrayAsync(cancellationToken);

        var monthlyBreakdown = monthStarts
            .Select(start =>
            {
                var end = start.AddMonths(1);
                return new AdminCommissionMonthlyMetricResponse
                {
                    PeriodStart = DateOnly.FromDateTime(start),
                    PeriodLabel = $"{start:yyyy-MM}",
                    GeneratedAmount = commissionRows
                        .Where(row => row.CreatedAt >= start && row.CreatedAt < end)
                        .Sum(row => row.CommissionAmount),
                    PendingAmount = commissionRows
                        .Where(row =>
                            row.Status == PlatformCommissionStatus.Pending &&
                            row.CreatedAt >= start &&
                            row.CreatedAt < end)
                        .Sum(row => row.CommissionAmount),
                    PaidAmount = commissionRows
                        .Where(row =>
                            row.Status == PlatformCommissionStatus.Paid &&
                            row.SettledAt.HasValue &&
                            row.SettledAt.Value >= start &&
                            row.SettledAt.Value < end)
                        .Sum(row => row.CommissionAmount)
                };
            })
            .ToArray();

        var allCommissions = await _dbContext.PlatformCommissions
            .AsNoTracking()
            .Select(commission => new
            {
                commission.CommissionAmount,
                commission.Status
            })
            .ToArrayAsync(cancellationToken);

        return new AdminMetricsResponse
        {
            UsersByRole = usersByRole,
            RequestsByStatus = requestsByStatus,
            TopLawyers = topLawyers,
            RequestsCreatedByWeek = requestsByWeek,
            TotalCommissionGenerated = allCommissions.Sum(item => item.CommissionAmount),
            TotalCommissionPending = allCommissions
                .Where(item => item.Status == PlatformCommissionStatus.Pending)
                .Sum(item => item.CommissionAmount),
            TotalCommissionPaid = allCommissions
                .Where(item => item.Status == PlatformCommissionStatus.Paid)
                .Sum(item => item.CommissionAmount),
            CommissionMonthlyBreakdown = monthlyBreakdown
        };
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        var diff = (7 + (date.DayOfWeek - DayOfWeek.Monday)) % 7;
        return date.AddDays(-diff);
    }
}
