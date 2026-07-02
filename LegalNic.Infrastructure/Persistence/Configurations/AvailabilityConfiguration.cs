using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class AvailabilityConfiguration : IEntityTypeConfiguration<Availability>
{
    public void Configure(EntityTypeBuilder<Availability> builder)
    {
        builder.ToTable("Availability");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.DayOfWeek)
            .IsRequired();

        builder.Property(entity => entity.StartTime)
            .HasColumnType("time")
            .IsRequired();

        builder.Property(entity => entity.EndTime)
            .HasColumnType("time")
            .IsRequired();

        builder.HasIndex(entity => new { entity.LawyerProfileId, entity.DayOfWeek, entity.StartTime, entity.EndTime });

        builder.HasOne(entity => entity.LawyerProfile)
            .WithMany(entity => entity.Availabilities)
            .HasForeignKey(entity => entity.LawyerProfileId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
