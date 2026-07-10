namespace LegalNic.Application.Lawyers;

public interface IFileStorageService
{
    Task<string> SaveVerificationDocumentAsync(
        string fileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken = default);
}
