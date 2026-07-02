using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Content)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(entity => entity.AttachmentUrl)
            .HasMaxLength(1000);

        builder.Property(entity => entity.SentAt)
            .IsRequired();

        builder.HasIndex(entity => new { entity.ServiceRequestId, entity.SentAt });

        builder.HasOne(entity => entity.ServiceRequest)
            .WithMany(entity => entity.Messages)
            .HasForeignKey(entity => entity.ServiceRequestId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.Sender)
            .WithMany(entity => entity.SentMessages)
            .HasForeignKey(entity => entity.SenderId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
