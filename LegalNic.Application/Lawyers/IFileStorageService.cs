namespace LegalNic.Application.Lawyers;

public interface IFileStorageService
{
    Task<string> SaveVerificationDocumentAsync(
        string fileName,
        Stream content,
        CancellationToken cancellationToken = default);
}
