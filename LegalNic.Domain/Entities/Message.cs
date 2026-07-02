using LegalNic.Domain.Common;

namespace LegalNic.Domain.Entities;

public sealed class Message : AuditableEntity
{
    public int ServiceRequestId { get; set; }

    public int SenderId { get; set; }

    public string Content { get; set; } = string.Empty;

    public string? AttachmentUrl { get; set; }

    public DateTime SentAt { get; set; }

    public bool IsRead { get; set; }

    public ServiceRequest ServiceRequest { get; set; } = null!;

    public User Sender { get; set; } = null!;
}
