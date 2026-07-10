using FluentValidation;
using FluentValidation.Results;
using LegalNic.Application.Billing;
using LegalNic.Application.Notifications;
using LegalNic.Application.ServiceRequests;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace LegalNic.Infrastructure.ServiceRequests;

public sealed class ServiceRequestService(
    LegalNicDbContext dbContext,
    IPlatformCommissionFactory platformCommissionFactory,
    INotificationService notificationService) : IServiceRequestService
{
    private readonly LegalNicDbContext _dbContext = dbContext;
    private readonly IPlatformCommissionFactory _platformCommissionFactory = platformCommissionFactory;
    private readonly INotificationService _notificationService = notificationService;

    public async Task<ServiceRequestDetailResponse> CreateAsync(
        int clientUserId,
        CreateServiceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        var service = await _dbContext.Services
            .AsNoTracking()
            .Where(entity => entity.Id == request.ServiceId && entity.IsActive)
            .Select(entity => new
            {
                entity.Id
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (service is null)
        {
            throw new KeyNotFoundException("Active service was not found.");
        }

        var serviceRequest = new ServiceRequest
        {
            ServiceId = service.Id,
            ClientId = clientUserId,
            CaseDetail = request.CaseDetail.Trim(),
            Status = ServiceRequestStatus.Pending
        };

        _dbContext.ServiceRequests.Add(serviceRequest);
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyNewServiceRequestReceivedAsync(serviceRequest.Id, cancellationToken);

        return await GetByIdAsync(clientUserId, isAdmin: false, serviceRequest.Id, cancellationToken);
    }

    public async Task<IReadOnlyCollection<ServiceRequestSummaryResponse>> GetMineAsync(
        int clientUserId,
        CancellationToken cancellationToken = default)
    {
        var requests = await _dbContext.ServiceRequests
            .AsNoTracking()
            .Where(request => request.ClientId == clientUserId)
            .OrderByDescending(request => request.CreatedAt)
            .Select(request => new ServiceRequestSummaryResponse
            {
                Id = request.Id,
                ServiceId = request.ServiceId,
                ServiceName = request.Service.Name,
                CounterpartyName = request.Service.LawyerProfile.User.FullName,
                Status = request.Status,
                CaseDetail = request.CaseDetail,
                AgreedPrice = request.AgreedPrice,
                CreatedAt = request.CreatedAt,
                CompletedAt = request.CompletedAt
            })
            .ToArrayAsync(cancellationToken);

        return requests;
    }

    public async Task<IReadOnlyCollection<ServiceRequestSummaryResponse>> GetReceivedAsync(
        int lawyerUserId,
        ServiceRequestStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = _dbContext.ServiceRequests
            .AsNoTracking()
            .Where(request => request.Service.LawyerProfile.UserId == lawyerUserId);

        if (status.HasValue)
        {
            query = query.Where(request => request.Status == status.Value);
        }

        var requests = await query
            .OrderByDescending(request => request.CreatedAt)
            .Select(request => new ServiceRequestSummaryResponse
            {
                Id = request.Id,
                ServiceId = request.ServiceId,
                ServiceName = request.Service.Name,
                CounterpartyName = request.Client.FullName,
                Status = request.Status,
                CaseDetail = request.CaseDetail,
                AgreedPrice = request.AgreedPrice,
                CreatedAt = request.CreatedAt,
                CompletedAt = request.CompletedAt
            })
            .ToArrayAsync(cancellationToken);

        return requests;
    }

    public async Task<ServiceRequestDetailResponse> GetByIdAsync(
        int currentUserId,
        bool isAdmin,
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        var detail = await _dbContext.ServiceRequests
            .AsNoTracking()
            .Where(request => request.Id == serviceRequestId)
            .Where(request => isAdmin
                || request.ClientId == currentUserId
                || request.Service.LawyerProfile.UserId == currentUserId)
            .Select(request => new ServiceRequestDetailResponse
            {
                Id = request.Id,
                ServiceId = request.ServiceId,
                ServiceName = request.Service.Name,
                CategoryName = request.Service.Category.Name,
                ClientId = request.ClientId,
                ClientName = request.Client.FullName,
                LawyerProfileId = request.Service.LawyerProfileId,
                LawyerName = request.Service.LawyerProfile.User.FullName,
                Status = request.Status,
                CaseDetail = request.CaseDetail,
                AgreedPrice = request.AgreedPrice,
                CreatedAt = request.CreatedAt,
                CompletedAt = request.CompletedAt,
                MessageCount = request.Messages.Count,
                CommissionAmount = request.PlatformCommission == null
                    ? null
                    : request.PlatformCommission.CommissionAmount,
                CommissionRate = request.PlatformCommission == null
                    ? null
                    : request.PlatformCommission.CommissionRate,
                CommissionStatus = request.PlatformCommission == null
                    ? null
                    : request.PlatformCommission.Status
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (detail is null)
        {
            throw new KeyNotFoundException("Service request was not found.");
        }

        return detail;
    }

    public async Task<ServiceRequestDetailResponse> AcceptAsync(
        int lawyerUserId,
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        var serviceRequest = await GetOwnedByLawyerAsync(lawyerUserId, serviceRequestId, cancellationToken);
        EnsureStatusTransition(serviceRequest.Status, ServiceRequestStatus.InProgress);

        serviceRequest.Status = ServiceRequestStatus.InProgress;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyServiceRequestAcceptedAsync(serviceRequestId, cancellationToken);

        return await GetByIdAsync(lawyerUserId, isAdmin: false, serviceRequestId, cancellationToken);
    }

    public async Task<ServiceRequestDetailResponse> RejectAsync(
        int lawyerUserId,
        int serviceRequestId,
        CancellationToken cancellationToken = default)
    {
        var serviceRequest = await GetOwnedByLawyerAsync(lawyerUserId, serviceRequestId, cancellationToken);
        EnsureStatusTransition(serviceRequest.Status, ServiceRequestStatus.Rejected);

        serviceRequest.Status = ServiceRequestStatus.Rejected;
        await _dbContext.SaveChangesAsync(cancellationToken);
        await _notificationService.NotifyServiceRequestRejectedAsync(serviceRequestId, cancellationToken);

        return await GetByIdAsync(lawyerUserId, isAdmin: false, serviceRequestId, cancellationToken);
    }

    public async Task<ServiceRequestDetailResponse> CompleteAsync(
        int lawyerUserId,
        int serviceRequestId,
        CompleteServiceRequestRequest request,
        CancellationToken cancellationToken = default)
    {
        if (!request.AgreedPrice.HasValue || request.AgreedPrice.Value <= 0)
        {
            throw new ValidationException([
                new ValidationFailure(nameof(request.AgreedPrice), "AgreedPrice must be greater than zero.")
            ]);
        }

        var serviceRequest = await GetOwnedByLawyerAsync(lawyerUserId, serviceRequestId, cancellationToken);
        EnsureStatusTransition(serviceRequest.Status, ServiceRequestStatus.Completed);

        var agreedPrice = decimal.Round(request.AgreedPrice.Value, 2, MidpointRounding.AwayFromZero);
        var startedTransaction = false;
        IDbContextTransaction? transaction = null;

        if (_dbContext.Database.IsRelational())
        {
            transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            startedTransaction = true;
        }

        try
        {
            serviceRequest.Status = ServiceRequestStatus.Completed;
            serviceRequest.CompletedAt = DateTime.UtcNow;
            serviceRequest.AgreedPrice = agreedPrice;

            var commission = _platformCommissionFactory.Create(
                serviceRequest.Id,
                serviceRequest.Service.LawyerProfileId,
                agreedPrice);

            _dbContext.PlatformCommissions.Add(commission);
            await _dbContext.SaveChangesAsync(cancellationToken);

            if (startedTransaction)
            {
                await transaction!.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (startedTransaction)
            {
                await transaction!.RollbackAsync(cancellationToken);
            }

            throw;
        }
        finally
        {
            if (transaction is not null)
            {
                await transaction.DisposeAsync();
            }
        }

        await _notificationService.NotifyServiceRequestCompletedAsync(serviceRequestId, cancellationToken);

        return await GetByIdAsync(lawyerUserId, isAdmin: false, serviceRequestId, cancellationToken);
    }

    private async Task<ServiceRequest> GetOwnedByLawyerAsync(
        int lawyerUserId,
        int serviceRequestId,
        CancellationToken cancellationToken)
    {
        var serviceRequest = await _dbContext.ServiceRequests
            .Include(request => request.Service)
            .ThenInclude(service => service.LawyerProfile)
            .SingleOrDefaultAsync(
                request => request.Id == serviceRequestId
                    && request.Service.LawyerProfile.UserId == lawyerUserId,
                cancellationToken);

        if (serviceRequest is null)
        {
            throw new KeyNotFoundException("Service request was not found.");
        }

        return serviceRequest;
    }

    private static void EnsureStatusTransition(
        ServiceRequestStatus currentStatus,
        ServiceRequestStatus targetStatus)
    {
        var isAllowed = currentStatus switch
        {
            ServiceRequestStatus.Pending when targetStatus is ServiceRequestStatus.InProgress
                or ServiceRequestStatus.Rejected => true,
            ServiceRequestStatus.InProgress when targetStatus == ServiceRequestStatus.Completed => true,
            _ => false
        };

        if (!isAllowed)
        {
            throw new InvalidOperationException(
                $"The transition from {currentStatus} to {targetStatus} is not allowed.");
        }
    }
}
