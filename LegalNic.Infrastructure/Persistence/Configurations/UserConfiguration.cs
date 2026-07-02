using LegalNic.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(entity => entity.Id);

        builder.Property(entity => entity.FullName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(entity => entity.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(entity => entity.PhoneNumber)
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(entity => entity.PasswordHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(entity => entity.Role)
            .IsRequired();

        builder.Property(entity => entity.CreatedAt)
            .IsRequired();

        builder.HasIndex(entity => entity.Email)
            .IsUnique();

        builder.HasIndex(entity => entity.PhoneNumber);
    }
}
