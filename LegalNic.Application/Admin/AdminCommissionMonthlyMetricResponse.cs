namespace LegalNic.Application.Admin;

public sealed class AdminCommissionMonthlyMetricResponse
{
    public string PeriodLabel { get; init; } = string.Empty;

    public DateOnly PeriodStart { get; init; }

    public decimal GeneratedAmount { get; init; }

    public decimal PendingAmount { get; init; }

    public decimal PaidAmount { get; init; }
}
