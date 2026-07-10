using LegalNic.Api.Extensions;
using LegalNic.Application.Common;
using LegalNic.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/services")]
public sealed class ServicesController(IServiceService serviceService) : ControllerBase
{
    private readonly IServiceService _serviceService = serviceService;

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPost]
    [ProducesResponseType(typeof(OwnedServiceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<OwnedServiceResponse>> Create(
        [FromBody] CreateServiceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceService.CreateMyServiceAsync(userId, request, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(OwnedServiceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OwnedServiceResponse>> Update(
        int id,
        [FromBody] UpdateServiceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceService.UpdateMyServiceAsync(userId, id, request, cancellationToken);

        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        await _serviceService.DeleteMyServiceAsync(userId, id, cancellationToken);

        return NoContent();
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpGet("mine")]
    [ProducesResponseType(typeof(IReadOnlyCollection<OwnedServiceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyCollection<OwnedServiceResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceService.GetMyServicesAsync(userId, cancellationToken);

        return Ok(response);
    }

    [AllowAnonymous]
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResponse<SearchServiceResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PagedResponse<SearchServiceResponse>>> Search(
        [FromQuery] SearchServicesRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _serviceService.SearchAsync(request, cancellationToken);
        return Ok(response);
    }
}
