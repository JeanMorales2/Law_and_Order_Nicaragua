using LegalNic.Application.Lawyers;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Lawyers;

public sealed class AdminVerificationService(LegalNicDbContext dbContext) : IAdminVerificationService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<IReadOnlyCollection<AdminVerificationDocumentResponse>> GetVerificationDocumentsAsync(
        DocumentReviewStatus status,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.VerificationDocuments
            .AsNoTracking()
            .Where(document => document.Status == status)
            .OrderBy(document => document.CreatedAt)
            .Select(document => new AdminVerificationDocumentResponse
            {
                Id = document.Id,
                LawyerProfileId = document.LawyerProfileId,
                UserId = document.LawyerProfile.UserId,
                LawyerFullName = document.LawyerProfile.User.FullName,
                DocumentType = document.DocumentType,
                FileUrl = document.FileUrl,
                Status = document.Status,
                CreatedAt = document.CreatedAt,
                ReviewedAt = document.ReviewedAt
            })
            .ToArrayAsync(cancellationToken);
    }

    public async Task<VerificationDocumentResponse> ApproveAsync(
        int documentId,
        int adminUserId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetVerificationDocumentAsync(documentId, cancellationToken);
        EnsurePending(document);

        document.Status = DocumentReviewStatus.Verified;
        document.ReviewedAt = DateTime.UtcNow;
        document.ReviewedByAdminId = adminUserId;
        document.LawyerProfile.VerificationStatus = VerificationStatus.Verified;
        document.LawyerProfile.User.IsVerified = true;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return document.ToResponse();
    }

    public async Task<VerificationDocumentResponse> RejectAsync(
        int documentId,
        int adminUserId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetVerificationDocumentAsync(documentId, cancellationToken);
        EnsurePending(document);

        document.Status = DocumentReviewStatus.Rejected;
        document.ReviewedAt = DateTime.UtcNow;
        document.ReviewedByAdminId = adminUserId;
        document.LawyerProfile.VerificationStatus = VerificationStatus.Rejected;
        document.LawyerProfile.User.IsVerified = false;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return document.ToResponse();
    }

    private async Task<Domain.Entities.VerificationDocument> GetVerificationDocumentAsync(
        int documentId,
        CancellationToken cancellationToken)
    {
        var document = await _dbContext.VerificationDocuments
            .Include(entity => entity.LawyerProfile)
            .ThenInclude(profile => profile.User)
            .SingleOrDefaultAsync(entity => entity.Id == documentId, cancellationToken);

        if (document is null)
        {
            throw new KeyNotFoundException("Verification document was not found.");
        }

        return document;
    }

    private static void EnsurePending(Domain.Entities.VerificationDocument document)
    {
        if (document.Status != DocumentReviewStatus.Pending)
        {
            throw new InvalidOperationException("Only pending verification documents can be reviewed.");
        }
    }
}
