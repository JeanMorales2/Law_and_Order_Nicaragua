namespace LegalNic.Application.Messages;

public interface IChatService
{
    Task EnsureCanAccessRequestAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyCollection<ChatMessageResponse>> GetMessagesAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        CancellationToken cancellationToken = default);

    Task MarkAsReadAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        CancellationToken cancellationToken = default);

    Task<ChatMessageResponse> SendMessageAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        string content,
        CancellationToken cancellationToken = default);
}
