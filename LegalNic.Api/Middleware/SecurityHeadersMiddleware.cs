namespace LegalNic.Api.Middleware;

public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            context.Response.Headers["X-Frame-Options"] = "DENY";
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            context.Response.Headers["X-XSS-Protection"] = "0";
            context.Response.Headers["Content-Security-Policy"] =
                "default-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

            return Task.CompletedTask;
        });

        await _next(context);
    }
}
