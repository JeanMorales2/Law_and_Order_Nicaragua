using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class PlatformCommissionConfiguration : IEntityTypeConfiguration<PlatformCommission>
{
    public void Configure(EntityTypeBuilder<PlatformCommission> builder)
    {
        builder.ToTable("PlatformCommissions");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.AgreedPrice)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(entity => entity.CommissionRate)
            .HasColumnType("decimal(5,4)")
            .IsRequired();

        builder.Property(entity => entity.CommissionAmount)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(entity => entity.Status)
            .IsRequired();

        builder.HasIndex(entity => entity.ServiceRequestId)
            .IsUnique();

        builder.HasIndex(entity => new { entity.LawyerProfileId, entity.Status });

        builder.HasOne(entity => entity.LawyerProfile)
            .WithMany(entity => entity.PlatformCommissions)
            .HasForeignKey(entity => entity.LawyerProfileId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
