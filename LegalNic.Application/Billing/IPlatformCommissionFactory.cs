using LegalNic.Domain.Entities;

namespace LegalNic.Application.Billing;

public interface IPlatformCommissionFactory
{
    PlatformCommission Create(
        int serviceRequestId,
        int lawyerProfileId,
        decimal agreedPrice);
}
