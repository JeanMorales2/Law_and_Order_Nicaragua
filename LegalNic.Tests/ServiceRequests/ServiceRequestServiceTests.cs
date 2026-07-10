using System.Text;
using FluentValidation;
using LegalNic.Api.Middleware;
using LegalNic.Application.Billing;
using LegalNic.Application.ServiceRequests;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.ServiceRequests;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using LegalNic.Tests.TestDoubles;
using Xunit;

namespace LegalNic.Tests.ServiceRequests;

public sealed class ServiceRequestServiceTests
{
    [Fact]
    public async Task CompleteAsync_WhenRequestIsPending_ThrowsAndDoesNotCreateCommission()
    {
        await using var fixture = await TestFixture.CreateAsync(ServiceRequestStatus.Pending);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.Service.CompleteAsync(
                fixture.LawyerUserId,
                fixture.ServiceRequestId,
                new CompleteServiceRequestRequest
                {
                    AgreedPrice = 1000m
                }));

        Assert.Contains("Pending to Completed", exception.Message);
        Assert.Equal(0, await fixture.DbContext.PlatformCommissions.CountAsync());
    }

    [Fact]
    public async Task AcceptAsync_WhenRequestIsRejected_Throws()
    {
        await using var fixture = await TestFixture.CreateAsync(ServiceRequestStatus.Rejected);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            fixture.Service.AcceptAsync(fixture.LawyerUserId, fixture.ServiceRequestId));

        Assert.Contains("Rejected to InProgress", exception.Message);
    }

    [Fact]
    public async Task CompleteAsync_WithAgreedPrice1000AndRatePoint05_CreatesCommissionOf50()
    {
        await using var fixture = await TestFixture.CreateAsync(ServiceRequestStatus.InProgress);

        var response = await fixture.Service.CompleteAsync(
            fixture.LawyerUserId,
            fixture.ServiceRequestId,
            new CompleteServiceRequestRequest
            {
                AgreedPrice = 1000m
            });

        var commission = await fixture.DbContext.PlatformCommissions.SingleAsync();
        var updatedRequest = await fixture.DbContext.ServiceRequests.SingleAsync();

        Assert.Equal(ServiceRequestStatus.Completed, response.Status);
        Assert.Equal(ServiceRequestStatus.Completed, updatedRequest.Status);
        Assert.Equal(1000m, updatedRequest.AgreedPrice);
        Assert.Equal(0.05m, commission.CommissionRate);
        Assert.Equal(50.00m, commission.CommissionAmount);
        Assert.Equal(PlatformCommissionStatus.Pending, commission.Status);
    }

    [Fact]
    public async Task CompleteAsync_WithoutAgreedPrice_Returns400AndDoesNotCreateCommission()
    {
        await using var fixture = await TestFixture.CreateAsync(ServiceRequestStatus.InProgress);

        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        var middleware = new GlobalExceptionMiddleware(
            async context =>
            {
                await fixture.Service.CompleteAsync(
                    fixture.LawyerUserId,
                    fixture.ServiceRequestId,
                    new CompleteServiceRequestRequest());
            },
            NullLogger<GlobalExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(httpContext);

        httpContext.Response.Body.Position = 0;
        var payload = await new StreamReader(httpContext.Response.Body, Encoding.UTF8).ReadToEndAsync();

        Assert.Equal(StatusCodes.Status400BadRequest, httpContext.Response.StatusCode);
        Assert.Contains("AgreedPrice must be greater than zero.", payload);
        Assert.Equal(0, await fixture.DbContext.PlatformCommissions.CountAsync());
    }

    private sealed class TestFixture : IAsyncDisposable
    {
        private TestFixture(
            LegalNicDbContext dbContext,
            ServiceRequestService service,
            int lawyerUserId,
            int serviceRequestId)
        {
            DbContext = dbContext;
            Service = service;
            LawyerUserId = lawyerUserId;
            ServiceRequestId = serviceRequestId;
        }

        public LegalNicDbContext DbContext { get; }

        public ServiceRequestService Service { get; }

        public int LawyerUserId { get; }

        public int ServiceRequestId { get; }

        public static async Task<TestFixture> CreateAsync(ServiceRequestStatus initialStatus)
        {
            var options = new DbContextOptionsBuilder<LegalNicDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options;

            var dbContext = new LegalNicDbContext(options);
            var serviceRequest = await SeedAsync(dbContext, initialStatus);

            var factory = new PlatformCommissionFactory(Options.Create(new BillingOptions
            {
                DefaultCommissionRate = 0.05m
            }));

            var service = new ServiceRequestService(
                dbContext,
                factory,
                new NullNotificationService());

            return new TestFixture(
                dbContext,
                service,
                serviceRequest.Service.LawyerProfile.UserId,
                serviceRequest.Id);
        }

        public ValueTask DisposeAsync()
        {
            return DbContext.DisposeAsync();
        }

        private static async Task<ServiceRequest> SeedAsync(
            LegalNicDbContext dbContext,
            ServiceRequestStatus initialStatus)
        {
            var category = new ServiceCategory
            {
                Id = 1,
                Name = "Vehículos",
                Description = "Servicios vehiculares"
            };

            var lawyerUser = new User
            {
                Id = 10,
                FullName = "Lic. Mario Sequeira",
                Email = "mario@legalnic.local",
                PhoneNumber = "8888-1101",
                Role = UserRole.Lawyer,
                IsVerified = true
            };

            var clientUser = new User
            {
                Id = 20,
                FullName = "Ana López",
                Email = "ana@legalnic.local",
                PhoneNumber = "8888-2101",
                Role = UserRole.Citizen,
                IsVerified = false
            };

            var lawyerProfile = new LawyerProfile
            {
                Id = 30,
                UserId = lawyerUser.Id,
                User = lawyerUser,
                BarNumber = "BAR-001",
                University = "UCA",
                IsStudent = false,
                YearsExperience = 8,
                Bio = "Bio",
                Department = "Managua",
                Municipality = "Managua",
                VerificationStatus = VerificationStatus.Verified
            };

            var service = new Service
            {
                Id = 40,
                LawyerProfileId = lawyerProfile.Id,
                LawyerProfile = lawyerProfile,
                CategoryId = category.Id,
                Category = category,
                Name = "Compra y venta de vehículo",
                Description = "Servicio",
                Price = 1500m,
                PriceType = PriceType.Fixed,
                EstimatedDays = 3,
                RequiredDocuments = "Cédula",
                IsActive = true
            };

            var serviceRequest = new ServiceRequest
            {
                Id = 50,
                ServiceId = service.Id,
                Service = service,
                ClientId = clientUser.Id,
                Client = clientUser,
                Status = initialStatus,
                CaseDetail = "Necesito ayuda con el traspaso."
            };

            if (initialStatus == ServiceRequestStatus.Rejected)
            {
                serviceRequest.CompletedAt = null;
            }

            dbContext.ServiceCategories.Add(category);
            dbContext.Users.AddRange(lawyerUser, clientUser);
            dbContext.LawyerProfiles.Add(lawyerProfile);
            dbContext.Services.Add(service);
            dbContext.ServiceRequests.Add(serviceRequest);

            await dbContext.SaveChangesAsync();

            return serviceRequest;
        }
    }
}
