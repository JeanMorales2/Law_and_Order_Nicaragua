using LegalNic.Application.Lawyers;
using Microsoft.AspNetCore.Hosting;

namespace LegalNic.Infrastructure.Lawyers;

public sealed class LocalFileStorageService(IWebHostEnvironment environment) : IFileStorageService
{
    private const string VerificationFolder = "uploads/verification";
    private readonly IWebHostEnvironment _environment = environment;

    public async Task<string> SaveVerificationDocumentAsync(
        string fileName,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var webRootPath = _environment.WebRootPath;

        if (string.IsNullOrWhiteSpace(webRootPath))
        {
            webRootPath = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }

        var targetDirectory = Path.Combine(webRootPath, "uploads", "verification");
        Directory.CreateDirectory(targetDirectory);

        var storedFileName = $"{Guid.NewGuid():N}{Path.GetExtension(fileName)}";
        var absolutePath = Path.Combine(targetDirectory, storedFileName);

        await using var fileStream = new FileStream(absolutePath, FileMode.CreateNew, FileAccess.Write);
        await content.CopyToAsync(fileStream, cancellationToken);

        return $"/{VerificationFolder}/{storedFileName}";
    }
}
