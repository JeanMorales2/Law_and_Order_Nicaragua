using LegalNic.Application.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/admin/categories")]
[Authorize(Roles = "Admin")]
public sealed class AdminCategoriesController(IAdminCategoryService adminCategoryService) : ControllerBase
{
    private readonly IAdminCategoryService _adminCategoryService = adminCategoryService;

    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<AdminCategoryResponse>>> GetAll(CancellationToken cancellationToken)
    {
        return Ok(await _adminCategoryService.GetAllAsync(cancellationToken));
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminCategoryResponse), StatusCodes.Status201Created)]
    public async Task<ActionResult<AdminCategoryResponse>> Create(
        [FromBody] AdminCategoryRequest request,
        CancellationToken cancellationToken)
    {
        var response = await _adminCategoryService.CreateAsync(request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<AdminCategoryResponse>> Update(
        int id,
        [FromBody] AdminCategoryRequest request,
        CancellationToken cancellationToken)
    {
        return Ok(await _adminCategoryService.UpdateAsync(id, request, cancellationToken));
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _adminCategoryService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
