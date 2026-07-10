namespace LegalNic.Application.Admin;

public sealed class AdminMetricTimeSeriesResponse
{
    public string PeriodLabel { get; init; } = string.Empty;

    public DateOnly PeriodStart { get; init; }

    public int Count { get; init; }
}
