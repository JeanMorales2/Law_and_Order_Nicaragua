using LegalNic.Domain.Common;
using LegalNic.Domain.Enums;

namespace LegalNic.Domain.Entities;

public sealed class User : AuditableEntity
{
    public string FullName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public bool IsVerified { get; set; }

    public LawyerProfile? LawyerProfile { get; set; }

    public ICollection<ServiceRequest> ClientServiceRequests { get; set; } = new List<ServiceRequest>();

    public ICollection<Message> SentMessages { get; set; } = new List<Message>();

    public ICollection<VerificationDocument> ReviewedVerificationDocuments { get; set; } =
        new List<VerificationDocument>();
}
