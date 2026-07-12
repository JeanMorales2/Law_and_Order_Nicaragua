using LegalNic.Api.Extensions;
using LegalNic.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Citizen,Lawyer,Student,Admin")]
public sealed class UsersController(ICurrentUserService currentUserService) : ControllerBase
{
    private readonly ICurrentUserService _currentUserService = currentUserService;

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
}
