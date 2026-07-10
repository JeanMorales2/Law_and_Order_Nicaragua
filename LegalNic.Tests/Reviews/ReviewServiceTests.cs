using System.Text;
using FluentValidation;
using LegalNic.Api.Middleware;
using LegalNic.Application.Reviews;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Persistence;
using LegalNic.Infrastructure.Reviews;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace LegalNic.Tests.Reviews;

public sealed class ReviewServiceTests
{
    [Fact]
    public async Task CreateAsync_WhenReviewAlreadyExists_Returns409Conflict()
    {
        await using var fixture = await TestFixture.CreateAsync();

        await fixture.Service.CreateAsync(
            fixture.ClientUserId,
            fixture.ServiceRequestId,
            new CreateReviewRequest
            {
                Rating = 5,
                Comment = "Excelente servicio."
            });

        var httpContext = new DefaultHttpContext();
        httpContext.Response.Body = new MemoryStream();

        var middleware = new GlobalExceptionMiddleware(
            async context =>
            {
                await fixture.Service.CreateAsync(
                    fixture.ClientUserId,
                    fixture.ServiceRequestId,
                    new CreateReviewRequest
                    {
                        Rating = 4,
                        Comment = "Segunda reseña no válida."
                    });
            },
            NullLogger<GlobalExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(httpContext);

        httpContext.Response.Body.Position = 0;
        var payload = await new StreamReader(httpContext.Response.Body, Encoding.UTF8).ReadToEndAsync();

        Assert.Equal(StatusCodes.Status409Conflict, httpContext.Response.StatusCode);
        Assert.Contains("review already exists", payload, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class TestFixture : IAsyncDisposable
    {
        private TestFixture(LegalNicDbContext dbContext, ReviewService service)
        {
            DbContext = dbContext;
            Service = service;
        }

        public LegalNicDbContext DbContext { get; }

        public ReviewService Service { get; }

        public int ClientUserId => 20;

        public int ServiceRequestId => 50;

        public static async Task<TestFixture> CreateAsync()
        {
            var options = new DbContextOptionsBuilder<LegalNicDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options;

            var dbContext = new LegalNicDbContext(options);
            await SeedAsync(dbContext);

            return new TestFixture(dbContext, new ReviewService(dbContext));
        }

        public ValueTask DisposeAsync()
        {
            return DbContext.DisposeAsync();
        }

        private static async Task SeedAsync(LegalNicDbContext dbContext)
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
                Status = ServiceRequestStatus.Completed,
                CaseDetail = "Necesito ayuda con el traspaso.",
                CompletedAt = DateTime.UtcNow
            };

            dbContext.ServiceCategories.Add(category);
            dbContext.Users.AddRange(lawyerUser, clientUser);
            dbContext.LawyerProfiles.Add(lawyerProfile);
            dbContext.Services.Add(service);
            dbContext.ServiceRequests.Add(serviceRequest);

            await dbContext.SaveChangesAsync();
        }
    }
}
