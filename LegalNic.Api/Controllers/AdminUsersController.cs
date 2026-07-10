using LegalNic.Application.Admin;
using LegalNic.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public sealed class AdminUsersController(IAdminUserService adminUserService) : ControllerBase
{
    private readonly IAdminUserService _adminUserService = adminUserService;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<AdminUserListItemResponse>>> GetUsers(
        [FromQuery] UserRole? role,
        [FromQuery] string? search,
        CancellationToken cancellationToken)
    {
        return Ok(await _adminUserService.GetUsersAsync(role, search, cancellationToken));
    }

    [HttpPut("{id:int}/suspend")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Suspend(int id, CancellationToken cancellationToken)
    {
        await _adminUserService.SuspendAsync(id, cancellationToken);
        return NoContent();
    }
}
