using System.Security.Claims;

namespace LegalNic.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetRequiredLegalNicUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirstValue("legalnic_user_id");

        if (!int.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("The current token does not contain a valid user identifier.");
        }

        return userId;
    }
}
