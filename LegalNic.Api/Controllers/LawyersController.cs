using LegalNic.Api.Extensions;
using LegalNic.Api.Models.Lawyers;
using LegalNic.Application.Lawyers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/lawyers")]
public sealed class LawyersController(ILawyerProfileService lawyerProfileService) : ControllerBase
{
    private readonly ILawyerProfileService _lawyerProfileService = lawyerProfileService;

    [AllowAnonymous]
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(PublicLawyerProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PublicLawyerProfileResponse>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var response = await _lawyerProfileService.GetPublicProfileAsync(id, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPut("me")]
    [ProducesResponseType(typeof(LawyerProfileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LawyerProfileResponse>> UpdateMe(
        [FromBody] UpdateLawyerProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _lawyerProfileService.UpdateMyProfileAsync(userId, request, cancellationToken);

        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPost("me/documents")]
    [ProducesResponseType(typeof(VerificationDocumentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VerificationDocumentResponse>> UploadDocument(
        [FromForm] UploadVerificationDocumentForm form,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();

        await using var stream = form.File!.OpenReadStream();
        var request = new UploadVerificationDocumentRequest
        {
            DocumentType = form.DocumentType
        };

        var response = await _lawyerProfileService.UploadMyVerificationDocumentAsync(
            userId,
            request,
            form.File.FileName,
            form.File.ContentType,
            stream,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, response);
    }
}
