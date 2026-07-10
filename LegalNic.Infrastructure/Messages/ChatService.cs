using FluentValidation;
using FluentValidation.Results;
using LegalNic.Application.Messages;
using LegalNic.Application.Notifications;
using LegalNic.Domain.Entities;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Messages;

public sealed class ChatService(
    LegalNicDbContext dbContext,
    INotificationService notificationService) : IChatService
{
    private readonly LegalNicDbContext _dbContext = dbContext;
    private readonly INotificationService _notificationService = notificationService;

    public async Task EnsureCanAccessRequestAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        CancellationToken cancellationToken = default)
    {
        var access = await GetRequestAccessAsync(requestId, cancellationToken);

        if (isAdmin)
        {
            return;
        }

        if (currentUserId != access.ClientId && currentUserId != access.LawyerUserId)
        {
            throw new UnauthorizedAccessException(
                "You do not have access to this service request conversation.");
        }
    }

    public async Task<IReadOnlyCollection<ChatMessageResponse>> GetMessagesAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanAccessRequestAsync(currentUserId, isAdmin, requestId, cancellationToken);

        return await _dbContext.Messages
            .AsNoTracking()
            .Where(message => message.ServiceRequestId == requestId)
            .OrderBy(message => message.SentAt)
            .ThenBy(message => message.Id)
            .Select(message => new ChatMessageResponse
            {
                Id = message.Id,
                ServiceRequestId = message.ServiceRequestId,
                SenderId = message.SenderId,
                SenderName = message.Sender.FullName,
                Content = message.Content,
                AttachmentUrl = message.AttachmentUrl,
                SentAt = message.SentAt,
                IsRead = message.IsRead
            })
            .ToArrayAsync(cancellationToken);
    }

    public async Task MarkAsReadAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanAccessRequestAsync(currentUserId, isAdmin, requestId, cancellationToken);

        var unreadMessages = await _dbContext.Messages
            .Where(message =>
                message.ServiceRequestId == requestId
                && message.SenderId != currentUserId
                && !message.IsRead)
            .ToArrayAsync(cancellationToken);

        if (unreadMessages.Length == 0)
        {
            return;
        }

        foreach (var unreadMessage in unreadMessages)
        {
            unreadMessage.IsRead = true;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<ChatMessageResponse> SendMessageAsync(
        int currentUserId,
        bool isAdmin,
        int requestId,
        string content,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanAccessRequestAsync(currentUserId, isAdmin, requestId, cancellationToken);

        var normalizedContent = NormalizeContent(content);
        var sender = await _dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == currentUserId)
            .Select(user => new
            {
                user.Id,
                user.FullName
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (sender is null)
        {
            throw new UnauthorizedAccessException("Authenticated user was not found.");
        }

        var sentAt = DateTime.UtcNow;
        var message = new Message
        {
            ServiceRequestId = requestId,
            SenderId = currentUserId,
            Content = normalizedContent,
            SentAt = sentAt,
            IsRead = false
        };

        _dbContext.Messages.Add(message);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyNewChatMessageAsync(
            requestId,
            currentUserId,
            normalizedContent,
            cancellationToken);

        return new ChatMessageResponse
        {
            Id = message.Id,
            ServiceRequestId = message.ServiceRequestId,
            SenderId = sender.Id,
            SenderName = sender.FullName,
            Content = message.Content,
            AttachmentUrl = message.AttachmentUrl,
            SentAt = message.SentAt,
            IsRead = message.IsRead
        };
    }

    private async Task<RequestAccess> GetRequestAccessAsync(
        int requestId,
        CancellationToken cancellationToken)
    {
        var access = await _dbContext.ServiceRequests
            .AsNoTracking()
            .Where(request => request.Id == requestId)
            .Select(request => new RequestAccess(
                request.ClientId,
                request.Service.LawyerProfile.UserId))
            .SingleOrDefaultAsync(cancellationToken);

        if (access is null)
        {
            throw new KeyNotFoundException("Service request was not found.");
        }

        return access;
    }

    private static string NormalizeContent(string content)
    {
        var normalizedContent = content.Trim();

        if (string.IsNullOrWhiteSpace(normalizedContent))
        {
            throw new ValidationException([
                new ValidationFailure(nameof(content), "Content is required.")
            ]);
        }

        if (normalizedContent.Length > 4000)
        {
            throw new ValidationException([
                new ValidationFailure(nameof(content), "Content must be 4000 characters or fewer.")
            ]);
        }

        return normalizedContent;
    }

    private sealed record RequestAccess(int ClientId, int LawyerUserId);
}
