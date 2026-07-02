using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using Microsoft.Extensions.Options;

namespace LegalNic.Application.Billing;

public sealed class PlatformCommissionFactory(IOptions<BillingOptions> options) : IPlatformCommissionFactory
{
    private readonly BillingOptions _options = options.Value;

    public PlatformCommission Create(
        int serviceRequestId,
        int lawyerProfileId,
        decimal agreedPrice)
    {
        if (agreedPrice <= 0)
        {
            throw new ArgumentOutOfRangeException(
                nameof(agreedPrice),
                "AgreedPrice must be greater than zero to generate a platform commission.");
        }

        var rate = _options.DefaultCommissionRate;

        if (rate <= 0)
        {
            throw new InvalidOperationException(
                "Billing:DefaultCommissionRate must be configured with a value greater than zero.");
        }

        var commissionAmount = decimal.Round(agreedPrice * rate, 2, MidpointRounding.AwayFromZero);

        return new PlatformCommission
        {
            ServiceRequestId = serviceRequestId,
            LawyerProfileId = lawyerProfileId,
            AgreedPrice = decimal.Round(agreedPrice, 2, MidpointRounding.AwayFromZero),
            CommissionRate = rate,
            CommissionAmount = commissionAmount,
            Status = PlatformCommissionStatus.Pending
        };
    }
}
