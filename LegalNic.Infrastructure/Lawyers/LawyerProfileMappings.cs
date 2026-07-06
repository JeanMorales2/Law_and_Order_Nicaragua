using LegalNic.Application.Lawyers;
using LegalNic.Domain.Entities;

namespace LegalNic.Infrastructure.Lawyers;

internal static class LawyerProfileMappings
{
    public static LawyerProfileResponse ToResponse(this LawyerProfile lawyerProfile)
    {
        return new LawyerProfileResponse
        {
            Id = lawyerProfile.Id,
            UserId = lawyerProfile.UserId,
            FullName = lawyerProfile.User.FullName,
            BarNumber = lawyerProfile.BarNumber,
            University = lawyerProfile.University,
            IsStudent = lawyerProfile.IsStudent,
            YearsExperience = lawyerProfile.YearsExperience,
            Bio = lawyerProfile.Bio,
            Department = lawyerProfile.Department,
            Municipality = lawyerProfile.Municipality,
            VerificationStatus = lawyerProfile.VerificationStatus,
            IsVerified = lawyerProfile.User.IsVerified
        };
    }

    public static VerificationDocumentResponse ToResponse(this VerificationDocument document)
    {
        return new VerificationDocumentResponse
        {
            Id = document.Id,
            LawyerProfileId = document.LawyerProfileId,
            DocumentType = document.DocumentType,
            FileUrl = document.FileUrl,
            Status = document.Status,
            CreatedAt = document.CreatedAt,
            ReviewedAt = document.ReviewedAt,
            ReviewedByAdminId = document.ReviewedByAdminId
        };
    }
}
