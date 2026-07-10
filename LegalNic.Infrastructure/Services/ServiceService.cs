using LegalNic.Application.Common;
using LegalNic.Application.Services;
using LegalNic.Domain.Entities;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Reviews;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Services;

public sealed class ServiceService(LegalNicDbContext dbContext) : IServiceService
{
    private readonly LegalNicDbContext _dbContext = dbContext;

    public async Task<OwnedServiceResponse> CreateMyServiceAsync(
        int userId,
        CreateServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfileId = await GetOwnedLawyerProfileIdAsync(userId, cancellationToken);
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var service = new Service
        {
            LawyerProfileId = lawyerProfileId,
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            Price = request.Price,
            PriceType = request.PriceType,
            EstimatedDays = request.EstimatedDays,
            RequiredDocuments = request.RequiredDocuments.Trim(),
            IsActive = true
        };

        _dbContext.Services.Add(service);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetOwnedServiceResponseAsync(service.Id, lawyerProfileId, cancellationToken);
    }

    public async Task<OwnedServiceResponse> UpdateMyServiceAsync(
        int userId,
        int serviceId,
        UpdateServiceRequest request,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfileId = await GetOwnedLawyerProfileIdAsync(userId, cancellationToken);
        await EnsureCategoryExistsAsync(request.CategoryId, cancellationToken);

        var service = await _dbContext.Services
            .SingleOrDefaultAsync(
                entity => entity.Id == serviceId && entity.LawyerProfileId == lawyerProfileId,
                cancellationToken);

        if (service is null)
        {
            throw new KeyNotFoundException("Service was not found for the current lawyer.");
        }

        service.CategoryId = request.CategoryId;
        service.Name = request.Name.Trim();
        service.Description = request.Description.Trim();
        service.Price = request.Price;
        service.PriceType = request.PriceType;
        service.EstimatedDays = request.EstimatedDays;
        service.RequiredDocuments = request.RequiredDocuments.Trim();
        service.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetOwnedServiceResponseAsync(service.Id, lawyerProfileId, cancellationToken);
    }

    public async Task DeleteMyServiceAsync(
        int userId,
        int serviceId,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfileId = await GetOwnedLawyerProfileIdAsync(userId, cancellationToken);

        var service = await _dbContext.Services
            .SingleOrDefaultAsync(
                entity => entity.Id == serviceId && entity.LawyerProfileId == lawyerProfileId,
                cancellationToken);

        if (service is null)
        {
            throw new KeyNotFoundException("Service was not found for the current lawyer.");
        }

        service.IsActive = false;
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<OwnedServiceResponse>> GetMyServicesAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var lawyerProfileId = await GetOwnedLawyerProfileIdAsync(userId, cancellationToken);

        var services = await _dbContext.Services
            .AsNoTracking()
            .Where(service => service.LawyerProfileId == lawyerProfileId)
            .OrderByDescending(service => service.IsActive)
            .ThenBy(service => service.Name)
            .Select(service => new OwnedServiceResponse
            {
                Id = service.Id,
                CategoryId = service.CategoryId,
                CategoryName = service.Category.Name,
                Name = service.Name,
                Description = service.Description,
                Price = service.Price,
                PriceType = service.PriceType,
                EstimatedDays = service.EstimatedDays,
                RequiredDocuments = service.RequiredDocuments,
                IsActive = service.IsActive
            })
            .ToArrayAsync(cancellationToken);

        return services;
    }

    public async Task<PagedResponse<SearchServiceResponse>> SearchAsync(
        SearchServicesRequest request,
        CancellationToken cancellationToken = default)
    {
        var categoryIds = await ResolveCategoryIdsAsync(request.CategoryId, cancellationToken);
        var reviewSummaries = _dbContext.BuildLawyerReviewSummaryQuery();

        var query = _dbContext.Services
            .AsNoTracking()
            .Where(service => service.IsActive)
            .GroupJoin(
                reviewSummaries,
                service => service.LawyerProfileId,
                summary => summary.LawyerProfileId,
                (service, summaries) => new
                {
                    Service = service,
                    ReviewSummary = summaries.SingleOrDefault()
                })
            .Select(entity => new SearchServiceProjection
            {
                ServiceId = entity.Service.Id,
                LawyerProfileId = entity.Service.LawyerProfileId,
                LawyerName = entity.Service.LawyerProfile.User.FullName,
                LawyerPhotoUrl = null,
                ServiceName = entity.Service.Name,
                ServiceDescription = entity.Service.Description,
                CategoryId = entity.Service.CategoryId,
                Price = entity.Service.Price,
                EstimatedDays = entity.Service.EstimatedDays,
                AverageRating = entity.ReviewSummary == null
                    ? null
                    : entity.ReviewSummary.AverageRating,
                ReviewCount = entity.ReviewSummary == null
                    ? 0
                    : entity.ReviewSummary.ReviewCount,
                Department = entity.Service.LawyerProfile.Department,
                Municipality = entity.Service.LawyerProfile.Municipality,
                IsVerified = entity.Service.LawyerProfile.User.IsVerified,
                IsStudent = entity.Service.LawyerProfile.IsStudent,
                CreatedAt = entity.Service.CreatedAt
            });

        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var term = request.Query.Trim();
            query = query.Where(service =>
                service.ServiceName.Contains(term) ||
                service.ServiceDescription.Contains(term) ||
                service.LawyerName.Contains(term));
        }

        if (categoryIds.Count > 0)
        {
            query = query.Where(service => categoryIds.Contains(service.CategoryId));
        }

        if (!string.IsNullOrWhiteSpace(request.City))
        {
            var city = request.City.Trim();
            query = query.Where(service =>
                service.Municipality.Contains(city) ||
                service.Department.Contains(city));
        }

        if (request.PriceMin.HasValue)
        {
            query = query.Where(service => service.Price >= request.PriceMin.Value);
        }

        if (request.PriceMax.HasValue)
        {
            query = query.Where(service => service.Price <= request.PriceMax.Value);
        }

        if (request.MinRating.HasValue)
        {
            query = query.Where(service =>
                service.AverageRating.HasValue &&
                service.AverageRating.Value >= request.MinRating.Value);
        }

        if (request.OnlyVerified == true)
        {
            query = query.Where(service => service.IsVerified);
        }

        query = request.SortBy?.Trim().ToLowerInvariant() switch
        {
            "rating" => query
                .OrderByDescending(service => service.AverageRating ?? 0)
                .ThenByDescending(service => service.ReviewCount)
                .ThenBy(service => service.Price),
            "price" => query
                .OrderBy(service => service.Price)
                .ThenByDescending(service => service.AverageRating ?? 0)
                .ThenBy(service => service.ServiceName),
            _ => query
                .OrderByDescending(service => service.CreatedAt)
                .ThenBy(service => service.ServiceName)
        };

        var totalCount = await query.CountAsync(cancellationToken);
        var page = request.Page;
        var pageSize = request.PageSize;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(service => new SearchServiceResponse
            {
                ServiceId = service.ServiceId,
                LawyerProfileId = service.LawyerProfileId,
                LawyerName = service.LawyerName,
                LawyerPhotoUrl = service.LawyerPhotoUrl,
                ServiceName = service.ServiceName,
                Price = service.Price,
                EstimatedDays = service.EstimatedDays,
                AverageRating = service.AverageRating.HasValue
                    ? Math.Round(service.AverageRating.Value, 2, MidpointRounding.AwayFromZero)
                    : null,
                ReviewCount = service.ReviewCount,
                City = service.Municipality,
                IsVerified = service.IsVerified,
                IsStudent = service.IsStudent
            })
            .ToArrayAsync(cancellationToken);

        return new PagedResponse<SearchServiceResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    private async Task<int> GetOwnedLawyerProfileIdAsync(int userId, CancellationToken cancellationToken)
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

        return lawyerProfileId.Value;
    }

    private async Task EnsureCategoryExistsAsync(int categoryId, CancellationToken cancellationToken)
    {
        var exists = await _dbContext.ServiceCategories
            .AsNoTracking()
            .AnyAsync(category => category.Id == categoryId, cancellationToken);

        if (!exists)
        {
            throw new KeyNotFoundException("Service category was not found.");
        }
    }

    private async Task<OwnedServiceResponse> GetOwnedServiceResponseAsync(
        int serviceId,
        int lawyerProfileId,
        CancellationToken cancellationToken)
    {
        var response = await _dbContext.Services
            .AsNoTracking()
            .Where(service => service.Id == serviceId && service.LawyerProfileId == lawyerProfileId)
            .Select(service => new OwnedServiceResponse
            {
                Id = service.Id,
                CategoryId = service.CategoryId,
                CategoryName = service.Category.Name,
                Name = service.Name,
                Description = service.Description,
                Price = service.Price,
                PriceType = service.PriceType,
                EstimatedDays = service.EstimatedDays,
                RequiredDocuments = service.RequiredDocuments,
                IsActive = service.IsActive
            })
            .SingleOrDefaultAsync(cancellationToken);

        if (response is null)
        {
            throw new KeyNotFoundException("Service was not found for the current lawyer.");
        }

        return response;
    }

    private async Task<HashSet<int>> ResolveCategoryIdsAsync(
        int? categoryId,
        CancellationToken cancellationToken)
    {
        if (!categoryId.HasValue)
        {
            return [];
        }

        var ids = await _dbContext.ServiceCategories
            .AsNoTracking()
            .Where(category => category.Id == categoryId.Value || category.ParentCategoryId == categoryId.Value)
            .Select(category => category.Id)
            .ToArrayAsync(cancellationToken);

        if (ids.Length == 0)
        {
            throw new KeyNotFoundException("Service category was not found.");
        }

        return ids.ToHashSet();
    }

    private sealed class SearchServiceProjection
    {
        public int ServiceId { get; init; }

        public int LawyerProfileId { get; init; }

        public int CategoryId { get; init; }

        public string LawyerName { get; init; } = string.Empty;

        public string? LawyerPhotoUrl { get; init; }

        public string ServiceName { get; init; } = string.Empty;

        public string ServiceDescription { get; init; } = string.Empty;

        public decimal Price { get; init; }

        public int EstimatedDays { get; init; }

        public decimal? AverageRating { get; init; }

        public int ReviewCount { get; init; }

        public string Department { get; init; } = string.Empty;

        public string Municipality { get; init; } = string.Empty;

        public bool IsVerified { get; init; }

        public bool IsStudent { get; init; }

        public DateTime CreatedAt { get; init; }
    }
}
