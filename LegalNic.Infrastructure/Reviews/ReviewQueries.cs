using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Reviews;

internal static class ReviewQueries
{
    public static IQueryable<LawyerReviewSummaryProjection> BuildLawyerReviewSummaryQuery(
        this LegalNicDbContext dbContext)
    {
        return dbContext.LawyerProfiles
            .AsNoTracking()
            .Select(profile => new LawyerReviewSummaryProjection
            {
                LawyerProfileId = profile.Id,
                AverageRating = profile.Services
                    .SelectMany(service => service.ServiceRequests)
                    .Where(serviceRequest => serviceRequest.Review != null)
                    .Select(serviceRequest => (decimal?)serviceRequest.Review!.Rating)
                    .Average(),
                ReviewCount = profile.Services
                    .SelectMany(service => service.ServiceRequests)
                    .Count(serviceRequest => serviceRequest.Review != null)
            });
    }
}
