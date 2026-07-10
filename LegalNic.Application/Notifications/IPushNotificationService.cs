namespace LegalNic.Application.Notifications;

public interface IPushNotificationService
{
    Task SendAsync(
        string deviceToken,
        string title,
        string body,
        CancellationToken cancellationToken = default);
}
