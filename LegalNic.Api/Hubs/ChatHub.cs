using FluentValidation;
using LegalNic.Api.Extensions;
using LegalNic.Application.Messages;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LegalNic.Api.Hubs;

[Authorize]
public sealed class ChatHub(IChatService chatService) : Hub
{
    private readonly IChatService _chatService = chatService;

    public async Task JoinRequestGroup(int requestId)
    {
        var currentUserId = Context.User?.GetRequiredLegalNicUserId()
            ?? throw new HubException("Authentication is required.");

        try
        {
            await _chatService.EnsureCanAccessRequestAsync(
                currentUserId,
                Context.User?.IsInRole("Admin") == true,
                requestId,
                Context.ConnectionAborted);

            await Groups.AddToGroupAsync(Context.ConnectionId, BuildGroupName(requestId), Context.ConnectionAborted);
        }
        catch (Exception exception) when (exception is ValidationException
            or UnauthorizedAccessException
            or InvalidOperationException
            or KeyNotFoundException)
        {
            throw new HubException(exception.Message);
        }
    }

    public async Task SendMessage(int requestId, string content)
    {
        var currentUserId = Context.User?.GetRequiredLegalNicUserId()
            ?? throw new HubException("Authentication is required.");

        try
        {
            var message = await _chatService.SendMessageAsync(
                currentUserId,
                Context.User?.IsInRole("Admin") == true,
                requestId,
                content,
                Context.ConnectionAborted);

            await Clients.Group(BuildGroupName(requestId))
                .SendAsync("ReceiveMessage", message, Context.ConnectionAborted);
        }
        catch (Exception exception) when (exception is ValidationException
            or UnauthorizedAccessException
            or InvalidOperationException
            or KeyNotFoundException)
        {
            throw new HubException(exception.Message);
        }
    }

    private static string BuildGroupName(int requestId)
    {
        return $"request-{requestId}";
    }
}
