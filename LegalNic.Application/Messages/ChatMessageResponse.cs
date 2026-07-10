namespace LegalNic.Application.Messages;

public sealed class ChatMessageResponse
{
    public int Id { get; init; }

    public int ServiceRequestId { get; init; }

    public int SenderId { get; init; }

    public string SenderName { get; init; } = string.Empty;

    public string Content { get; init; } = string.Empty;

    public string? AttachmentUrl { get; init; }

    public DateTime SentAt { get; init; }

    public bool IsRead { get; init; }
}
