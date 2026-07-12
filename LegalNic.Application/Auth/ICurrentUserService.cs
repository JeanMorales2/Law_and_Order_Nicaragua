namespace LegalNic.Application.Auth;

public interface ICurrentUserService
{
    Task<CurrentUserResponse> GetCurrentUserAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<CurrentUserResponse> UpdateCurrentUserAsync(
        int userId,
        UpdateCurrentUserRequest request,
        CancellationToken cancellationToken = default);
}
