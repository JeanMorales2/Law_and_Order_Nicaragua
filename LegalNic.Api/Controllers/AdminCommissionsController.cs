using LegalNic.Application.Commissions;
using LegalNic.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/admin/commissions")]
[Authorize(Roles = "Admin")]
public sealed class AdminCommissionsController(ICommissionService commissionService) : ControllerBase
{
    private readonly ICommissionService _commissionService = commissionService;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<AdminCommissionListItemResponse>>> GetAll(
        [FromQuery] PlatformCommissionStatus? status,
        [FromQuery(Name = "lawyerId")] int? lawyerProfileId,
        CancellationToken cancellationToken)
    {
        return Ok(await _commissionService.GetAdminCommissionsAsync(status, lawyerProfileId, cancellationToken));
    }

    [HttpPut("{id:int}/mark-paid")]
    public async Task<ActionResult<AdminCommissionListItemResponse>> MarkPaid(int id, CancellationToken cancellationToken)
    {
        return Ok(await _commissionService.MarkAsPaidAsync(id, cancellationToken));
    }
}
