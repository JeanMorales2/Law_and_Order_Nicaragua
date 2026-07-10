using FluentValidation;
using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Messages;
using LegalNic.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using LegalNic.Tests.TestDoubles;
using Xunit;

namespace LegalNic.Tests.Messages;

public sealed class ChatServiceTests
{
    [Fact]
    public async Task SendMessageAsync_WhenUserBelongsToRequest_PersistsAndReturnsMessage()
    {
        await using var fixture = await TestFixture.CreateAsync();

        var response = await fixture.Service.SendMessageAsync(
            fixture.ClientUserId,
            isAdmin: false,
            fixture.ServiceRequestId,
            "  Hola abogado  ");

        var message = await fixture.DbContext.Messages.SingleAsync();

        Assert.Equal(fixture.ServiceRequestId, response.ServiceRequestId);
        Assert.Equal(fixture.ClientUserId, response.SenderId);
        Assert.Equal("Ana López", response.SenderName);
        Assert.Equal("Hola abogado", response.Content);
        Assert.False(response.IsRead);
        Assert.Equal(response.Id, message.Id);
        Assert.Equal("Hola abogado", message.Content);
        Assert.False(message.IsRead);
    }

    [Fact]
    public async Task SendMessageAsync_WhenContentIsBlank_ThrowsValidationException()
    {
        await using var fixture = await TestFixture.CreateAsync();

        var exception = await Assert.ThrowsAsync<ValidationException>(() =>
            fixture.Service.SendMessageAsync(
                fixture.ClientUserId,
                isAdmin: false,
                fixture.ServiceRequestId,
                "   "));

        Assert.Contains("Content is required.", exception.Message);
        Assert.Equal(0, await fixture.DbContext.Messages.CountAsync());
    }

    [Fact]
    public async Task MarkAsReadAsync_WhenRecipientOpensChat_MarksOtherUsersUnreadMessages()
    {
        await using var fixture = await TestFixture.CreateAsync();
        await fixture.SeedMessageAsync(fixture.LawyerUserId, "Mensaje del abogado", isRead: false);
        await fixture.SeedMessageAsync(fixture.ClientUserId, "Mensaje del cliente", isRead: false);

        await fixture.Service.MarkAsReadAsync(
            fixture.ClientUserId,
            isAdmin: false,
            fixture.ServiceRequestId);

        var messages = await fixture.DbContext.Messages
            .OrderBy(message => message.Id)
            .ToArrayAsync();

        Assert.True(messages[0].IsRead);
        Assert.False(messages[1].IsRead);
    }

    [Fact]
    public async Task GetMessagesAsync_WhenUserIsNotParticipant_ThrowsUnauthorizedAccessException()
    {
        await using var fixture = await TestFixture.CreateAsync();

        var exception = await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            fixture.Service.GetMessagesAsync(
                fixture.OtherUserId,
                isAdmin: false,
                fixture.ServiceRequestId));

        Assert.Contains("do not have access", exception.Message);
    }

    private sealed class TestFixture : IAsyncDisposable
    {
        private TestFixture(LegalNicDbContext dbContext, ChatService service)
        {
            DbContext = dbContext;
            Service = service;
        }

        public LegalNicDbContext DbContext { get; }

        public ChatService Service { get; }

        public int ClientUserId => 20;

        public int LawyerUserId => 10;

        public int OtherUserId => 30;

        public int ServiceRequestId => 50;

        public static async Task<TestFixture> CreateAsync()
        {
            var options = new DbContextOptionsBuilder<LegalNicDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
                .Options;

            var dbContext = new LegalNicDbContext(options);
            await SeedAsync(dbContext);

            return new TestFixture(
                dbContext,
                new ChatService(dbContext, new NullNotificationService()));
        }

        public async Task SeedMessageAsync(int senderId, string content, bool isRead)
        {
            DbContext.Messages.Add(new Message
            {
                ServiceRequestId = ServiceRequestId,
                SenderId = senderId,
                Content = content,
                SentAt = DateTime.UtcNow,
                IsRead = isRead
            });

            await DbContext.SaveChangesAsync();
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

            var otherUser = new User
            {
                Id = 30,
                FullName = "Usuario externo",
                Email = "otro@legalnic.local",
                PhoneNumber = "8888-9999",
                Role = UserRole.Citizen,
                IsVerified = false
            };

            var lawyerProfile = new LawyerProfile
            {
                Id = 40,
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
                Id = 45,
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
                Status = ServiceRequestStatus.InProgress,
                CaseDetail = "Necesito ayuda con el traspaso."
            };

            dbContext.ServiceCategories.Add(category);
            dbContext.Users.AddRange(lawyerUser, clientUser, otherUser);
            dbContext.LawyerProfiles.Add(lawyerProfile);
            dbContext.Services.Add(service);
            dbContext.ServiceRequests.Add(serviceRequest);

            await dbContext.SaveChangesAsync();
        }
    }
}
