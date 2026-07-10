namespace LegalNic.Application.Reviews;

public interface IReviewService
{
    Task<ReviewResponse> CreateAsync(
        int currentUserId,
        int serviceRequestId,
        CreateReviewRequest request,
        CancellationToken cancellationToken = default);

    Task<LawyerReviewsResponse> GetLawyerReviewsAsync(
        int lawyerProfileId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
