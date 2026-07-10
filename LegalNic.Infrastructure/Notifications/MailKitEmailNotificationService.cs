using LegalNic.Application.Notifications;
using LegalNic.Infrastructure.Persistence;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace LegalNic.Infrastructure.Notifications;

public sealed class MailKitEmailNotificationService(
    LegalNicDbContext dbContext,
    IOptions<NotificationOptions> options,
    IMemoryCache memoryCache,
    ILogger<MailKitEmailNotificationService> logger) : INotificationService
{
    private readonly LegalNicDbContext _dbContext = dbContext;
    private readonly NotificationOptions _options = options.Value;
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly ILogger<MailKitEmailNotificationService> _logger = logger;

    public Task NotifyNewServiceRequestReceivedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        return NotifySingleRecipientAsync(
            serviceRequestId,
            recipientSelector: request => request.Service.LawyerProfile.User,
            subject: request => $"Nueva solicitud recibida: {request.Service.Name}",
            bodyFactory: request =>
                $"Hola {request.Service.LawyerProfile.User.FullName},\n\n" +
                $"Has recibido una nueva solicitud para el servicio \"{request.Service.Name}\" " +
                $"de {request.Client.FullName}.\n\nDetalle del caso:\n{request.CaseDetail}\n",
            cancellationToken);
    }

    public Task NotifyServiceRequestAcceptedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        return NotifySingleRecipientAsync(
            serviceRequestId,
            recipientSelector: request => request.Client,
            subject: request => $"Tu solicitud fue aceptada: {request.Service.Name}",
            bodyFactory: request =>
                $"Hola {request.Client.FullName},\n\n" +
                $"{request.Service.LawyerProfile.User.FullName} aceptó tu solicitud para " +
                $"\"{request.Service.Name}\".\n",
            cancellationToken);
    }

    public Task NotifyServiceRequestRejectedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        return NotifySingleRecipientAsync(
            serviceRequestId,
            recipientSelector: request => request.Client,
            subject: request => $"Tu solicitud fue rechazada: {request.Service.Name}",
            bodyFactory: request =>
                $"Hola {request.Client.FullName},\n\n" +
                $"{request.Service.LawyerProfile.User.FullName} rechazó tu solicitud para " +
                $"\"{request.Service.Name}\".\n",
            cancellationToken);
    }

    public Task NotifyServiceRequestCompletedAsync(
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        return NotifySingleRecipientAsync(
            serviceRequestId,
            recipientSelector: request => request.Client,
            subject: request => $"Tu solicitud fue finalizada: {request.Service.Name}",
            bodyFactory: request =>
                $"Hola {request.Client.FullName},\n\n" +
                $"La solicitud para \"{request.Service.Name}\" fue marcada como finalizada. " +
                $"Monto acordado: {request.AgreedPrice:C2}.\n",
            cancellationToken);
    }

    public async Task NotifyNewChatMessageAsync(
        int serviceRequestId,
        int senderUserId,
        string content,
        CancellationToken cancellationToken = default)
    {
        var request = await GetNotificationRequestAsync(serviceRequestId, cancellationToken);

        var recipient = request.Client.Id == senderUserId
            ? request.Service.LawyerProfile.User
            : request.Client;

        var cacheKey = $"chat-email:{serviceRequestId}:{recipient.Id}";
        var throttle = TimeSpan.FromMinutes(Math.Max(1, _options.ChatEmailThrottleMinutes));

        if (_memoryCache.TryGetValue(cacheKey, out _))
        {
            _logger.LogInformation(
                "Skipping chat email notification due to throttle. RequestId={RequestId}, RecipientUserId={RecipientUserId}",
                serviceRequestId,
                recipient.Id);
            return;
        }

        _memoryCache.Set(cacheKey, true, throttle);

        var senderName = request.Client.Id == senderUserId
            ? request.Client.FullName
            : request.Service.LawyerProfile.User.FullName;

        await SendEmailIfPossibleAsync(
            recipient.Email,
            recipient.FullName,
            $"Nuevo mensaje en tu solicitud: {request.Service.Name}",
            $"Hola {recipient.FullName},\n\n" +
            $"{senderName} envió un nuevo mensaje en la conversación de \"{request.Service.Name}\".\n\n" +
            $"Mensaje:\n{content}\n",
            cancellationToken);
    }

    private async Task NotifySingleRecipientAsync(
        int serviceRequestId,
        Func<Domain.Entities.ServiceRequest, Domain.Entities.User> recipientSelector,
        Func<Domain.Entities.ServiceRequest, string> subject,
        Func<Domain.Entities.ServiceRequest, string> bodyFactory,
        CancellationToken cancellationToken)
    {
        var request = await GetNotificationRequestAsync(serviceRequestId, cancellationToken);
        var recipient = recipientSelector(request);

        await SendEmailIfPossibleAsync(
            recipient.Email,
            recipient.FullName,
            subject(request),
            bodyFactory(request),
            cancellationToken);
    }

    private async Task<Domain.Entities.ServiceRequest> GetNotificationRequestAsync(
        int serviceRequestId,
        CancellationToken cancellationToken)
    {
        var request = await _dbContext.ServiceRequests
            .AsNoTracking()
            .Include(item => item.Client)
            .Include(item => item.Service)
                .ThenInclude(service => service.LawyerProfile)
                    .ThenInclude(profile => profile.User)
            .SingleOrDefaultAsync(item => item.Id == serviceRequestId, cancellationToken);

        if (request is null)
        {
            throw new KeyNotFoundException("Service request was not found.");
        }

        return request;
    }

    private async Task SendEmailIfPossibleAsync(
        string recipientEmail,
        string recipientName,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(recipientEmail))
        {
            _logger.LogWarning("Skipping email notification because recipient email is empty. Subject={Subject}", subject);
            return;
        }

        if (string.IsNullOrWhiteSpace(_options.SmtpHost)
            || string.IsNullOrWhiteSpace(_options.FromEmail))
        {
            _logger.LogWarning(
                "Skipping email notification because SMTP settings are incomplete. Subject={Subject}, Recipient={Recipient}",
                subject,
                recipientEmail);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_options.FromName, _options.FromEmail));
        message.To.Add(new MailboxAddress(recipientName, recipientEmail));
        message.Subject = subject;
        message.Body = new TextPart("plain") { Text = body };

        try
        {
            using var smtpClient = new SmtpClient();
            var secureSocketOptions = _options.UseStartTls
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.Auto;

            await smtpClient.ConnectAsync(
                _options.SmtpHost,
                _options.SmtpPort,
                secureSocketOptions,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(_options.SmtpUsername))
            {
                await smtpClient.AuthenticateAsync(
                    _options.SmtpUsername,
                    _options.SmtpPassword,
                    cancellationToken);
            }

            await smtpClient.SendAsync(message, cancellationToken);
            await smtpClient.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Failed to send email notification. Subject={Subject}, Recipient={Recipient}",
                subject,
                recipientEmail);
        }
    }
}
