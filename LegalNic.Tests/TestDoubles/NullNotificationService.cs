using LegalNic.Application.Notifications;

namespace LegalNic.Tests.TestDoubles;

internal sealed class NullNotificationService : INotificationService
{
    public Task NotifyNewServiceRequestReceivedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task NotifyServiceRequestAcceptedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task NotifyServiceRequestRejectedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task NotifyServiceRequestCompletedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default) => Task.CompletedTask;

    public Task NotifyNewChatMessageAsync(
        int serviceRequestId,
        int senderUserId,
        string content,
        CancellationToken cancellationToken = default) => Task.CompletedTask;
}
