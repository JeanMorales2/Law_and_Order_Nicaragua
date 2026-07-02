namespace LegalNic.Application.Billing;

public sealed class BillingOptions
{
    public const string SectionName = "Billing";

    public decimal DefaultCommissionRate { get; set; }
}
