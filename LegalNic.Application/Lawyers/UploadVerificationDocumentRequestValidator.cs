using FluentValidation;

namespace LegalNic.Application.Lawyers;

public sealed class UploadVerificationDocumentRequestValidator : AbstractValidator<UploadVerificationDocumentRequest>
{
    public UploadVerificationDocumentRequestValidator()
    {
        RuleFor(request => request.DocumentType)
            .NotEmpty()
            .MaximumLength(100);
    }
}
