using LegalNic.Domain.Entities;
using LegalNic.Infrastructure.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LegalNic.Infrastructure.Persistence.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("AuthUsers");

        builder.HasIndex(entity => entity.DomainUserId)
            .IsUnique();

        builder.HasOne<User>()
            .WithOne()
            .HasForeignKey<ApplicationUser>(entity => entity.DomainUserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
