using LegalNic.Application.Common;
using LegalNic.Application.Reviews;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Reviews;

public sealed class ReviewService(LegalNicDbContext dbContext) : IReviewService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<ReviewResponse> CreateAsync(
        int currentUserId,
        int serviceRequestId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var serviceRequest = await _dbContext.ServiceRequests
            .Include(entity => entity.Review)
            .SingleOrDefaultAsync(entity => entity.Id == serviceRequestId, cancellationToken);

        if (serviceRequest is null)
        {
            throw new KeyNotFoundException("Service request was not found.");
        }

        if (serviceRequest.ClientId != currentUserId)
        {
            throw new UnauthorizedAccessException("You do not own this service request.");
        }

        if (serviceRequest.Status != ServiceRequestStatus.Completed)
        {
            throw new InvalidOperationException("Reviews can only be created for completed service requests.");
        }

        if (serviceRequest.Review is not null)
        {
            throw new ConflictException("A review already exists for this service request.");
        }

        var review = new Review
        {
            ServiceRequestId = serviceRequestId,
            Rating = request.Rating,
            Comment = request.Comment.Trim()
        };

        _dbContext.Reviews.Add(review);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new ReviewResponse
        {
            Id = review.Id,
            ServiceRequestId = review.ServiceRequestId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    public async Task<LawyerReviewsResponse> GetLawyerReviewsAsync(
        int lawyerProfileId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (page <= 0)
        {
            throw new InvalidOperationException("Page must be greater than zero.");
        }

        if (pageSize <= 0)
        {
            throw new InvalidOperationException("PageSize must be greater than zero.");
        }

        var lawyerExists = await _dbContext.LawyerProfiles
            .AsNoTracking()
            .AnyAsync(profile => profile.Id == lawyerProfileId, cancellationToken);

        if (!lawyerExists)
        {
            throw new KeyNotFoundException("Lawyer profile was not found.");
        }

        var reviewSummaryQuery = _dbContext.BuildLawyerReviewSummaryQuery();
        var summary = await reviewSummaryQuery
            .Where(entity => entity.LawyerProfileId == lawyerProfileId)
            .SingleAsync(cancellationToken);

        var reviewsQuery = _dbContext.Reviews
            .AsNoTracking()
            .Where(review => review.ServiceRequest.Service.LawyerProfileId == lawyerProfileId)
            .OrderByDescending(review => review.CreatedAt)
            .ThenByDescending(review => review.Id);

        var items = await reviewsQuery
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(review => new LawyerReviewItemResponse
            {
                Id = review.Id,
                ServiceRequestId = review.ServiceRequestId,
                ClientId = review.ServiceRequest.ClientId,
                ClientName = review.ServiceRequest.Client.FullName,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt
            })
            .ToArrayAsync(cancellationToken);

        return new LawyerReviewsResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = summary.ReviewCount,
            AverageRating = summary.AverageRating.HasValue
                ? Math.Round(summary.AverageRating.Value, 2, MidpointRounding.AwayFromZero)
                : null
        };
    }
}
