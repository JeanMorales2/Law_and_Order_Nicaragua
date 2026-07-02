using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.ToTable("Services");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Name)
            .HasMaxLength(150)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(entity => entity.Price)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(entity => entity.RequiredDocuments)
            .HasMaxLength(4000)
            .IsRequired();

        builder.HasIndex(entity => new { entity.LawyerProfileId, entity.CategoryId, entity.Name });

        builder.HasOne(entity => entity.LawyerProfile)
            .WithMany(entity => entity.Services)
            .HasForeignKey(entity => entity.LawyerProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.Category)
            .WithMany(entity => entity.Services)
            .HasForeignKey(entity => entity.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
