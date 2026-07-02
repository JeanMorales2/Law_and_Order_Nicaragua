using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class ReviewConfiguration : IEntityTypeConfiguration<Review>
{
    public void Configure(EntityTypeBuilder<Review> builder)
    {
        builder.ToTable("Reviews", tableBuilder =>
        {
            tableBuilder.HasCheckConstraint("CK_Reviews_Rating", "[Rating] >= 1 AND [Rating] <= 5");
        });

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.Comment)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(entity => entity.Rating)
            .IsRequired();

        builder.HasIndex(entity => entity.ServiceRequestId)
            .IsUnique();

        builder.HasOne(entity => entity.ServiceRequest)
            .WithOne(entity => entity.Review)
            .HasForeignKey<Review>(entity => entity.ServiceRequestId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
