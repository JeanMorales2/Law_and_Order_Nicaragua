using Microsoft.AspNetCore.Http;

namespace LegalNic.Api.Models.Lawyers;

public sealed class UploadVerificationDocumentForm
{
    public string DocumentType { get; set; } = string.Empty;

    public IFormFile? File { get; set; }
}
