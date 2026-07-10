using LegalNic.Application.Notifications;
using Microsoft.Extensions.Logging;

namespace LegalNic.Infrastructure.Notifications;

public sealed class StubPushNotificationService(ILogger<StubPushNotificationService> logger) : IPushNotificationService
{
    private readonly ILogger<StubPushNotificationService> _logger = logger;

    public Task SendAsync(
        string deviceToken,
        string title,
        string body,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation(
            "Stub push notification invoked. DeviceToken={DeviceToken}, Title={Title}, BodyLength={BodyLength}",
            deviceToken,
            title,
            body.Length);

        return Task.CompletedTask;
    }
}
