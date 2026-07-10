using LegalNic.Api.Extensions;
using LegalNic.Api.Models.Lawyers;
using LegalNic.Application.Availability;
using LegalNic.Application.Commissions;
using LegalNic.Application.Lawyers;
using LegalNic.Application.Reviews;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/lawyers")]
public sealed class LawyersController(
    ILawyerProfileService lawyerProfileService,
    IReviewService reviewService,
    IAvailabilityService availabilityService,
    ICommissionService commissionService) : ControllerBase
{
    private readonly ILawyerProfileService _lawyerProfileService = lawyerProfileService;
    private readonly IReviewService _reviewService = reviewService;
    private readonly IAvailabilityService _availabilityService = availabilityService;
    private readonly ICommissionService _commissionService = commissionService;

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

    [AllowAnonymous]
    [HttpGet("{id:int}/reviews")]
    [ProducesResponseType(typeof(LawyerReviewsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LawyerReviewsResponse>> GetReviews(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var response = await _reviewService.GetLawyerReviewsAsync(id, page, pageSize, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpGet("me/availability")]
    public async Task<ActionResult<IReadOnlyCollection<AvailabilityDayResponse>>> GetMyAvailability(
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        return Ok(await _availabilityService.GetMyAvailabilityAsync(userId, cancellationToken));
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPut("me/availability")]
    public async Task<ActionResult<IReadOnlyCollection<AvailabilityDayResponse>>> ReplaceMyAvailability(
        [FromBody] IReadOnlyCollection<AvailabilityDayRequest> request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        return Ok(await _availabilityService.ReplaceMyAvailabilityAsync(userId, request, cancellationToken));
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpGet("me/commissions")]
    public async Task<ActionResult<LawyerCommissionAccountResponse>> GetMyCommissions(
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        return Ok(await _commissionService.GetMyCommissionsAsync(userId, cancellationToken));
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
