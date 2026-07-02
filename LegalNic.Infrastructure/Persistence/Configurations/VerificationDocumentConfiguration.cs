using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class VerificationDocumentConfiguration : IEntityTypeConfiguration<VerificationDocument>
{
    public void Configure(EntityTypeBuilder<VerificationDocument> builder)
    {
        builder.ToTable("VerificationDocuments");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.DocumentType)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(entity => entity.FileUrl)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(entity => entity.Status)
            .IsRequired();

        builder.HasIndex(entity => new { entity.LawyerProfileId, entity.DocumentType, entity.IsDeleted });

        builder.HasOne(entity => entity.LawyerProfile)
            .WithMany(entity => entity.VerificationDocuments)
            .HasForeignKey(entity => entity.LawyerProfileId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(entity => entity.ReviewedByAdmin)
            .WithMany(entity => entity.ReviewedVerificationDocuments)
            .HasForeignKey(entity => entity.ReviewedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
