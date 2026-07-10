using LegalNic.Application.Lawyers;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Reviews;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Lawyers;

public sealed class LawyerProfileService(
    LegalNicDbContext dbContext,
    IFileStorageService fileStorageService) : ILawyerProfileService
{
    private readonly LegalNicDbContext _dbContext = dbContext;
    private readonly IFileStorageService _fileStorageService = fileStorageService;

    public async Task<PublicLawyerProfileResponse> GetPublicProfileAsync(
        int lawyerProfileId,
        CancellationToken cancellationToken = default)
    {
        var reviewSummaries = _dbContext.BuildLawyerReviewSummaryQuery();

        var lawyerProfile = await _dbContext.LawyerProfiles
            .AsNoTracking()
            .Where(profile => profile.Id == lawyerProfileId)
            .GroupJoin(
                reviewSummaries,
                profile => profile.Id,
                summary => summary.LawyerProfileId,
                (profile, summaries) => new
                {
                    Profile = profile,
                    ReviewSummary = summaries.SingleOrDefault()
                })
            .Select(entity => new PublicLawyerProfileResponse
            {
                Id = entity.Profile.Id,
                UserId = entity.Profile.UserId,
                FullName = entity.Profile.User.FullName,
                University = entity.Profile.University,
                IsStudent = entity.Profile.IsStudent,
                YearsExperience = entity.Profile.YearsExperience,
                Bio = entity.Profile.Bio,
                Department = entity.Profile.Department,
                Municipality = entity.Profile.Municipality,
                VerificationStatus = entity.Profile.VerificationStatus,
                IsVerified = entity.Profile.User.IsVerified,
                AverageRating = entity.ReviewSummary == null
                    ? null
                    : entity.ReviewSummary.AverageRating,
                ActiveServices = entity.Profile.Services
                    .Where(service => service.IsActive)
                    .OrderBy(service => service.Name)
                    .Select(service => new PublicLawyerServiceResponse
                    {
                        Id = service.Id,
                        CategoryId = service.CategoryId,
                        CategoryName = service.Category.Name,
                        Name = service.Name,
                        Description = service.Description,
                        Price = service.Price,
                        PriceType = service.PriceType,
                        EstimatedDays = service.EstimatedDays,
                        RequiredDocuments = service.RequiredDocuments
                    })
                    .ToArray()
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (lawyerProfile is null)
        {
            throw new KeyNotFoundException("Lawyer profile was not found.");
        }

        return WithAverageRounded(lawyerProfile);

        static PublicLawyerProfileResponse WithAverageRounded(PublicLawyerProfileResponse response)
        {
            return new PublicLawyerProfileResponse
            {
                Id = response.Id,
                UserId = response.UserId,
                FullName = response.FullName,
                University = response.University,
                IsStudent = response.IsStudent,
                YearsExperience = response.YearsExperience,
                Bio = response.Bio,
                Department = response.Department,
                Municipality = response.Municipality,
                VerificationStatus = response.VerificationStatus,
                IsVerified = response.IsVerified,
                AverageRating = response.AverageRating.HasValue
                    ? Math.Round(response.AverageRating.Value, 2, MidpointRounding.AwayFromZero)
                    : null,
                ActiveServices = response.ActiveServices
            };
        }
    }

    public async Task<LawyerProfileResponse> UpdateMyProfileAsync(
        int userId,
        UpdateLawyerProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfile = await GetOwnedLawyerProfileAsync(userId, cancellationToken);

        lawyerProfile.Bio = request.Bio.Trim();
        lawyerProfile.Department = request.Department.Trim();
        lawyerProfile.Municipality = request.Municipality.Trim();
        lawyerProfile.YearsExperience = request.YearsExperience;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return lawyerProfile.ToResponse();
    }

    public async Task<VerificationDocumentResponse> UploadMyVerificationDocumentAsync(
        int userId,
        UploadVerificationDocumentRequest request,
        string fileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        _ = contentType;

        var lawyerProfile = await GetOwnedLawyerProfileAsync(userId, cancellationToken);
        var fileUrl = await _fileStorageService.SaveVerificationDocumentAsync(
            fileName,
            contentType,
            content,
            cancellationToken);

        var document = new VerificationDocument
        {
            LawyerProfileId = lawyerProfile.Id,
            DocumentType = request.DocumentType.Trim(),
            FileUrl = fileUrl,
            Status = DocumentReviewStatus.Pending
        };

        if (lawyerProfile.VerificationStatus != VerificationStatus.Verified)
        {
            lawyerProfile.VerificationStatus = VerificationStatus.Pending;
            lawyerProfile.User.IsVerified = false;
        }

        _dbContext.VerificationDocuments.Add(document);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return document.ToResponse();
    }

    private async Task<LawyerProfile> GetOwnedLawyerProfileAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var lawyerProfile = await _dbContext.LawyerProfiles
            .Include(profile => profile.User)
            .SingleOrDefaultAsync(profile => profile.UserId == userId, cancellationToken);

        if (lawyerProfile is null)
        {
            throw new KeyNotFoundException("Lawyer profile for the current user was not found.");
        }

        return lawyerProfile;
    }
}
