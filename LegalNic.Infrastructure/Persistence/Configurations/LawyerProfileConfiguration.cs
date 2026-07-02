using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class LawyerProfileConfiguration : IEntityTypeConfiguration<LawyerProfile>
{
    public void Configure(EntityTypeBuilder<LawyerProfile> builder)
    {
        builder.ToTable("LawyerProfiles");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.BarNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(entity => entity.University)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Bio)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(entity => entity.Department)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entity => entity.Municipality)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entity => entity.VerificationStatus)
            .IsRequired();

        builder.HasIndex(entity => entity.UserId)
            .IsUnique();

        builder.HasIndex(entity => entity.BarNumber)
            .IsUnique();

        builder.HasOne(entity => entity.User)
            .WithOne(user => user.LawyerProfile)
            .HasForeignKey<LawyerProfile>(entity => entity.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
