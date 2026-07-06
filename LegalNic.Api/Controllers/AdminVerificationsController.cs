using LegalNic.Api.Extensions;
using LegalNic.Application.Lawyers;
using LegalNic.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/admin/verifications")]
[Authorize(Roles = "Admin")]
public sealed class AdminVerificationsController(IAdminVerificationService adminVerificationService) : ControllerBase
{
    private readonly IAdminVerificationService _adminVerificationService = adminVerificationService;

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyCollection<AdminVerificationDocumentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyCollection<AdminVerificationDocumentResponse>>> GetByStatus(
        [FromQuery] DocumentReviewStatus status = DocumentReviewStatus.Pending,
        CancellationToken cancellationToken = default)
    {
        var response = await _adminVerificationService.GetVerificationDocumentsAsync(status, cancellationToken);
        return Ok(response);
    }

    [HttpPut("{documentId:int}/approve")]
    [ProducesResponseType(typeof(VerificationDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VerificationDocumentResponse>> Approve(
        int documentId,
        CancellationToken cancellationToken)
    {
        var adminUserId = User.GetRequiredLegalNicUserId();
        var response = await _adminVerificationService.ApproveAsync(documentId, adminUserId, cancellationToken);

        return Ok(response);
    }

    [HttpPut("{documentId:int}/reject")]
    [ProducesResponseType(typeof(VerificationDocumentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VerificationDocumentResponse>> Reject(
        int documentId,
        CancellationToken cancellationToken)
    {
        var adminUserId = User.GetRequiredLegalNicUserId();
        var response = await _adminVerificationService.RejectAsync(documentId, adminUserId, cancellationToken);

        return Ok(response);
    }
}
