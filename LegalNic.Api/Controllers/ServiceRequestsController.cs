using LegalNic.Api.Extensions;
using LegalNic.Application.Messages;
using LegalNic.Application.Reviews;
using LegalNic.Application.ServiceRequests;
using LegalNic.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/requests")]
public sealed class ServiceRequestsController(
    IServiceRequestService serviceRequestService,
    IChatService chatService,
    IReviewService reviewService) : ControllerBase
{
    private readonly IServiceRequestService _serviceRequestService = serviceRequestService;
    private readonly IChatService _chatService = chatService;
    private readonly IReviewService _reviewService = reviewService;

    [Authorize(Roles = "Citizen")]
    [HttpPost]
    [ProducesResponseType(typeof(ServiceRequestDetailResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceRequestDetailResponse>> Create(
        [FromBody] CreateServiceRequestRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.CreateAsync(userId, request, cancellationToken);

        return StatusCode(StatusCodes.Status201Created, response);
    }

    [Authorize(Roles = "Citizen")]
    [HttpGet("mine")]
    [ProducesResponseType(typeof(IReadOnlyCollection<ServiceRequestSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyCollection<ServiceRequestSummaryResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.GetMineAsync(userId, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpGet("received")]
    [ProducesResponseType(typeof(IReadOnlyCollection<ServiceRequestSummaryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyCollection<ServiceRequestSummaryResponse>>> GetReceived(
        [FromQuery] ServiceRequestStatus? status,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.GetReceivedAsync(userId, status, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Citizen,Lawyer,Student,Admin")]
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ServiceRequestDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceRequestDetailResponse>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.GetByIdAsync(
            userId,
            User.IsInRole("Admin"),
            id,
            cancellationToken);

        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPut("{id:int}/accept")]
    [ProducesResponseType(typeof(ServiceRequestDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceRequestDetailResponse>> Accept(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.AcceptAsync(userId, id, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPut("{id:int}/reject")]
    [ProducesResponseType(typeof(ServiceRequestDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceRequestDetailResponse>> Reject(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.RejectAsync(userId, id, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Lawyer,Student")]
    [HttpPut("{id:int}/complete")]
    [ProducesResponseType(typeof(ServiceRequestDetailResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ServiceRequestDetailResponse>> Complete(
        int id,
        [FromBody] CompleteServiceRequestRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _serviceRequestService.CompleteAsync(userId, id, request, cancellationToken);
        return Ok(response);
    }

    [Authorize(Roles = "Citizen,Lawyer,Student,Admin")]
    [HttpGet("{id:int}/messages")]
    [ProducesResponseType(typeof(IReadOnlyCollection<ChatMessageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyCollection<ChatMessageResponse>>> GetMessages(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _chatService.GetMessagesAsync(
            userId,
            User.IsInRole("Admin"),
            id,
            cancellationToken);

        return Ok(response);
    }

    [Authorize(Roles = "Citizen,Lawyer,Student,Admin")]
    [HttpPut("{id:int}/messages/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkMessagesAsRead(
        int id,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        await _chatService.MarkAsReadAsync(
            userId,
            User.IsInRole("Admin"),
            id,
            cancellationToken);

        return NoContent();
    }

    [Authorize(Roles = "Citizen")]
    [HttpPost("{id:int}/review")]
    [ProducesResponseType(typeof(ReviewResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ReviewResponse>> CreateReview(
        int id,
        [FromBody] CreateReviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.GetRequiredLegalNicUserId();
        var response = await _reviewService.CreateAsync(userId, id, request, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, response);
    }
}
