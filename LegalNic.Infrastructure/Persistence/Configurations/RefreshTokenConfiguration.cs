using LegalNic.Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.TokenHash)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(entity => entity.ReplacedByTokenHash)
            .HasMaxLength(128);

        builder.HasIndex(entity => entity.TokenHash)
            .IsUnique();

        builder.HasOne(entity => entity.ApplicationUser)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(entity => entity.ApplicationUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
