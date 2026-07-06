namespace LegalNic.Application.Lawyers;

public interface ILawyerProfileService
{
    Task<PublicLawyerProfileResponse> GetPublicProfileAsync(
        int lawyerProfileId,
        CancellationToken cancellationToken = default);

    Task<LawyerProfileResponse> UpdateMyProfileAsync(
        int userId,
        UpdateLawyerProfileRequest request,
        CancellationToken cancellationToken = default);

    Task<VerificationDocumentResponse> UploadMyVerificationDocumentAsync(
        int userId,
        UploadVerificationDocumentRequest request,
        string fileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken = default);
}
