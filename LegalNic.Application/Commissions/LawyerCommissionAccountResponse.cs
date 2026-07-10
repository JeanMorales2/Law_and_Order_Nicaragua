namespace LegalNic.Application.Commissions;

public sealed class LawyerCommissionAccountResponse
{
    public required IReadOnlyCollection<LawyerCommissionItemResponse> Items { get; init; }

    public decimal TotalGenerated { get; init; }

    public decimal TotalPending { get; init; }
}
