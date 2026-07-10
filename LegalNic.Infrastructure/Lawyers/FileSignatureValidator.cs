using FluentValidation;

namespace LegalNic.Infrastructure.Lawyers;

internal static class FileSignatureValidator
{
    private static readonly IReadOnlyDictionary<string, byte[][]> Signatures =
        new Dictionary<string, byte[][]>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = ["%PDF"u8.ToArray()],
            [".jpg"] = [[0xFF, 0xD8, 0xFF]],
            [".jpeg"] = [[0xFF, 0xD8, 0xFF]],
            [".png"] = [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]]
        };

    private static readonly IReadOnlyDictionary<string, string[]> ContentTypes =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = ["application/pdf"],
            [".jpg"] = ["image/jpeg"],
            [".jpeg"] = ["image/jpeg"],
            [".png"] = ["image/png"]
        };

    public static async Task ValidateAsync(
        string fileName,
        string contentType,
        Stream content,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();

        if (!Signatures.ContainsKey(extension))
        {
            throw new ValidationException("Only pdf, jpg, jpeg and png files are allowed.");
        }

        if (!ContentTypes[extension].Contains(contentType, StringComparer.OrdinalIgnoreCase))
        {
            throw new ValidationException("The uploaded file content type does not match the allowed document type.");
        }

        if (!content.CanSeek)
        {
            throw new ValidationException("The uploaded file stream must be seekable.");
        }

        var maxSignatureLength = Signatures[extension].Max(signature => signature.Length);
        var buffer = new byte[maxSignatureLength];
        content.Position = 0;
        var read = await content.ReadAsync(buffer.AsMemory(0, maxSignatureLength), cancellationToken);
        content.Position = 0;

        var matches = Signatures[extension].Any(signature =>
            read >= signature.Length &&
            buffer.AsSpan(0, signature.Length).SequenceEqual(signature));

        if (!matches)
        {
            throw new ValidationException("The uploaded file content does not match its declared type.");
        }
    }
}
