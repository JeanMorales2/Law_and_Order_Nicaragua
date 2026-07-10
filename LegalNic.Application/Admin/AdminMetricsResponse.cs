namespace LegalNic.Application.Admin;

public sealed class AdminMetricsResponse
{
    public required IReadOnlyCollection<AdminMetricCountResponse> UsersByRole { get; init; }

    public required IReadOnlyCollection<AdminMetricCountResponse> RequestsByStatus { get; init; }

    public required IReadOnlyCollection<AdminTopLawyerMetricResponse> TopLawyers { get; init; }

    public required IReadOnlyCollection<AdminMetricTimeSeriesResponse> RequestsCreatedByWeek { get; init; }

    public decimal TotalCommissionGenerated { get; init; }

    public decimal TotalCommissionPending { get; init; }

    public decimal TotalCommissionPaid { get; init; }

    public required IReadOnlyCollection<AdminCommissionMonthlyMetricResponse> CommissionMonthlyBreakdown { get; init; }
}
