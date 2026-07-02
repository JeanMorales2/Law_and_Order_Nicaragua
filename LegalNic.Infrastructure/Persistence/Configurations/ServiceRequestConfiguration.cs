using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class ServiceRequestConfiguration : IEntityTypeConfiguration<ServiceRequest>
{
    public void Configure(EntityTypeBuilder<ServiceRequest> builder)
    {
        builder.ToTable("ServiceRequests");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.CaseDetail)
            .HasMaxLength(4000)
            .IsRequired();

        builder.Property(entity => entity.AgreedPrice)
            .HasColumnType("decimal(10,2)");

        builder.Property(entity => entity.Status)
            .IsRequired();

        builder.HasIndex(entity => new { entity.ClientId, entity.Status });

        builder.HasOne(entity => entity.Service)
            .WithMany(entity => entity.ServiceRequests)
            .HasForeignKey(entity => entity.ServiceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.Client)
            .WithMany(entity => entity.ClientServiceRequests)
            .HasForeignKey(entity => entity.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.PlatformCommission)
            .WithOne(entity => entity.ServiceRequest)
            .HasForeignKey<PlatformCommission>(entity => entity.ServiceRequestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
