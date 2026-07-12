using LegalNic.Api.Extensions;
using LegalNic.Application.Auth;
using LegalNic.Application.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Citizen,Lawyer,Student,Admin")]
public sealed class UsersController(
    ICurrentUserService currentUserService,
    IPushNotificationService pushNotificationService,
    ILogger<UsersController> logger) : ControllerBase
{
    private readonly ICurrentUserService _currentUserService = currentUserService;
    private readonly IPushNotificationService _pushNotificationService = pushNotificationService;
    private readonly ILogger<UsersController> _logger = logger;

    [HttpGet("me")]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserResponse>> Me(CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _currentUserService.GetCurrentUserAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPut("me")]
    [ProducesResponseType(typeof(CurrentUserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CurrentUserResponse>> UpdateMe(
        [FromBody] UpdateCurrentUserRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _currentUserService.UpdateCurrentUserAsync(userId, request, cancellationToken);
        return Ok(response);
    }

    [HttpPost("me/device-token")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RegisterDeviceToken(
        [FromBody] RegisterDeviceTokenRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();

        _logger.LogInformation(
            "Device token registered for UserId={UserId}. Platform={Platform}, TokenLength={TokenLength}",
            userId,
            request.Platform,
            request.DeviceToken.Length);

        await _pushNotificationService.SendAsync(
            request.DeviceToken,
            "LegalNic",
            "Tu dispositivo quedo registrado para notificaciones.",
            cancellationToken);

        return NoContent();
    }
}
