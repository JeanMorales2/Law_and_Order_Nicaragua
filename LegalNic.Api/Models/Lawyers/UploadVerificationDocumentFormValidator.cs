using FluentValidation;

namespace LegalNic.Api.Models.Lawyers;

public sealed class UploadVerificationDocumentFormValidator : AbstractValidator<UploadVerificationDocumentForm>
{
    private static readonly string[] AllowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    private static readonly string[] AllowedContentTypes =
    [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    public UploadVerificationDocumentFormValidator()
    {
        RuleFor(request => request.DocumentType)
            .NotEmpty()
            .MaximumLength(100);

        RuleFor(request => request.File)
            .NotNull()
            .Must(file => file is not null && file.Length > 0)
            .WithMessage("A file is required.")
            .Must(file => file is not null && file.Length <= 5 * 1024 * 1024)
            .WithMessage("The file size must be 5 MB or less.")
            .Must(file => file is not null && AllowedExtensions.Contains(Path.GetExtension(file.FileName).ToLowerInvariant()))
            .WithMessage("Only pdf, jpg, jpeg and png files are allowed.")
            .Must(file => file is not null && AllowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            .WithMessage("Only pdf, jpg and png content types are allowed.");
    }
}
