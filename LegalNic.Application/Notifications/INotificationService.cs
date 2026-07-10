namespace LegalNic.Application.Notifications;

public interface INotificationService
{
    Task NotifyNewServiceRequestReceivedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task NotifyServiceRequestAcceptedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task NotifyServiceRequestRejectedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task NotifyServiceRequestCompletedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default);

    Task NotifyNewChatMessageAsync(
        int serviceRequestId,
        int senderUserId,
        string content,
        CancellationToken cancellationToken = default);
}
