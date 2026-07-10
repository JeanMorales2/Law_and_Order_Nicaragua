using LegalNic.Application.Commissions;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Commissions;

public sealed class CommissionService(LegalNicDbContext dbContext) : ICommissionService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<LawyerCommissionAccountResponse> GetMyCommissionsAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfileId = await _dbContext.LawyerProfiles
            .AsNoTracking()
            .Where(profile => profile.UserId == userId)
            .Select(profile => (int?)profile.Id)
            .SingleOrDefaultAsync(cancellationToken);

        if (!lawyerProfileId.HasValue)
        {
            throw new KeyNotFoundException("Lawyer profile for the current user was not found.");
        }

        var items = await QueryCommissions()
            .Where(item => item.LawyerProfileId == lawyerProfileId.Value)
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new LawyerCommissionItemResponse
            {
                Id = item.Id,
                ServiceRequestId = item.ServiceRequestId,
                ServiceName = item.ServiceName,
                ClientName = item.ClientName,
                AgreedPrice = item.AgreedPrice,
                CommissionAmount = item.CommissionAmount,
                Status = item.Status,
                CreatedAt = item.CreatedAt,
                SettledAt = item.SettledAt
            })
            .ToArrayAsync(cancellationToken);

        return new LawyerCommissionAccountResponse
        {
            Items = items,
            TotalGenerated = items.Sum(item => item.CommissionAmount),
            TotalPending = items
                .Where(item => item.Status == PlatformCommissionStatus.Pending)
                .Sum(item => item.CommissionAmount)
        };
    }

    public async Task<IReadOnlyCollection<AdminCommissionListItemResponse>> GetAdminCommissionsAsync(
        PlatformCommissionStatus? status,
        int? lawyerProfileId,
        CancellationToken cancellationToken = default)
    {
        var query = QueryCommissions();

        if (status.HasValue)
        {
            query = query.Where(item => item.Status == status.Value);
        }

        if (lawyerProfileId.HasValue)
        {
            query = query.Where(item => item.LawyerProfileId == lawyerProfileId.Value);
        }

        return await query
            .OrderByDescending(item => item.CreatedAt)
            .Select(item => new AdminCommissionListItemResponse
            {
                Id = item.Id,
                LawyerProfileId = item.LawyerProfileId,
                LawyerName = item.LawyerName,
                ServiceRequestId = item.ServiceRequestId,
                ServiceName = item.ServiceName,
                ClientName = item.ClientName,
                AgreedPrice = item.AgreedPrice,
                CommissionAmount = item.CommissionAmount,
                CommissionRate = item.CommissionRate,
                Status = item.Status,
                CreatedAt = item.CreatedAt,
                SettledAt = item.SettledAt
            })
            .ToArrayAsync(cancellationToken);
    }

    public async Task<AdminCommissionListItemResponse> MarkAsPaidAsync(
        int commissionId,
        CancellationToken cancellationToken = default)
    {
        var commission = await _dbContext.PlatformCommissions
            .Include(item => item.ServiceRequest)
                .ThenInclude(request => request.Service)
            .Include(item => item.ServiceRequest)
                .ThenInclude(request => request.Client)
            .Include(item => item.LawyerProfile)
                .ThenInclude(profile => profile.User)
            .SingleOrDefaultAsync(item => item.Id == commissionId, cancellationToken);

        if (commission is null)
        {
            throw new KeyNotFoundException("Platform commission was not found.");
        }

        if (commission.Status == PlatformCommissionStatus.Paid)
        {
            throw new InvalidOperationException("Platform commission is already marked as paid.");
        }

        if (commission.Status == PlatformCommissionStatus.Waived)
        {
            throw new InvalidOperationException("Waived commissions cannot be marked as paid.");
        }

        commission.Status = PlatformCommissionStatus.Paid;
        commission.SettledAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new AdminCommissionListItemResponse
        {
            Id = commission.Id,
            LawyerProfileId = commission.LawyerProfileId,
            LawyerName = commission.LawyerProfile.User.FullName,
            ServiceRequestId = commission.ServiceRequestId,
            ServiceName = commission.ServiceRequest.Service.Name,
            ClientName = commission.ServiceRequest.Client.FullName,
            AgreedPrice = commission.AgreedPrice,
            CommissionAmount = commission.CommissionAmount,
            CommissionRate = commission.CommissionRate,
            Status = commission.Status,
            CreatedAt = commission.CreatedAt,
            SettledAt = commission.SettledAt
        };
    }

    private IQueryable<CommissionProjection> QueryCommissions()
    {
        return _dbContext.PlatformCommissions
            .AsNoTracking()
            .Select(item => new CommissionProjection
            {
                Id = item.Id,
                LawyerProfileId = item.LawyerProfileId,
                LawyerName = item.LawyerProfile.User.FullName,
                ServiceRequestId = item.ServiceRequestId,
                ServiceName = item.ServiceRequest.Service.Name,
                ClientName = item.ServiceRequest.Client.FullName,
                AgreedPrice = item.AgreedPrice,
                CommissionAmount = item.CommissionAmount,
                CommissionRate = item.CommissionRate,
                Status = item.Status,
                CreatedAt = item.CreatedAt,
                SettledAt = item.SettledAt
            });
    }

    private sealed class CommissionProjection
    {
        public int Id { get; init; }

        public int LawyerProfileId { get; init; }

        public string LawyerName { get; init; } = string.Empty;

        public int ServiceRequestId { get; init; }

        public string ServiceName { get; init; } = string.Empty;

        public string ClientName { get; init; } = string.Empty;

        public decimal AgreedPrice { get; init; }

        public decimal CommissionAmount { get; init; }

        public decimal CommissionRate { get; init; }

        public PlatformCommissionStatus Status { get; init; }

        public DateTime CreatedAt { get; init; }

        public DateTime? SettledAt { get; init; }
    }
}
