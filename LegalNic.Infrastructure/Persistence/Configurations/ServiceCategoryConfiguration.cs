using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class ServiceCategoryConfiguration : IEntityTypeConfiguration<ServiceCategory>
{
    public void Configure(EntityTypeBuilder<ServiceCategory> builder)
    {
        builder.ToTable("ServiceCategories");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Name)
            .HasMaxLength(120)
            .IsRequired();

        builder.Property(entity => entity.Description)
            .HasMaxLength(500)
            .IsRequired();

        builder.HasIndex(entity => entity.Name)
            .IsUnique();

        builder.HasOne(entity => entity.ParentCategory)
            .WithMany(entity => entity.ChildCategories)
            .HasForeignKey(entity => entity.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
