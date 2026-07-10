using LegalNic.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/admin/metrics")]
[Authorize(Roles = "Admin")]
public sealed class AdminMetricsController(IAdminMetricsService adminMetricsService) : ControllerBase
{
    private readonly IAdminMetricsService _adminMetricsService = adminMetricsService;

    [HttpGet]
    public async Task<ActionResult<AdminMetricsResponse>> Get(CancellationToken cancellationToken)
    {
        return Ok(await _adminMetricsService.GetAsync(cancellationToken));
    }
}
