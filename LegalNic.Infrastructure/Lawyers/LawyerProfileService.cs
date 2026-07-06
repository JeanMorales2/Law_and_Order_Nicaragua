using LegalNic.Application.Lawyers;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
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
        var lawyerProfile = await _dbContext.LawyerProfiles
            .AsNoTracking()
            .Where(profile => profile.Id == lawyerProfileId)
            .Select(profile => new PublicLawyerProfileResponse
            {
                Id = profile.Id,
                UserId = profile.UserId,
                FullName = profile.User.FullName,
                University = profile.University,
                IsStudent = profile.IsStudent,
                YearsExperience = profile.YearsExperience,
                Bio = profile.Bio,
                Department = profile.Department,
                Municipality = profile.Municipality,
                VerificationStatus = profile.VerificationStatus,
                IsVerified = profile.User.IsVerified,
                AverageRating = profile.Services
                    .SelectMany(service => service.ServiceRequests)
                    .Where(serviceRequest => serviceRequest.Review != null)
                    .Select(serviceRequest => (decimal?)serviceRequest.Review!.Rating)
                    .Average(),
                ActiveServices = profile.Services
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
        var fileUrl = await _fileStorageService.SaveVerificationDocumentAsync(fileName, content, cancellationToken);

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
