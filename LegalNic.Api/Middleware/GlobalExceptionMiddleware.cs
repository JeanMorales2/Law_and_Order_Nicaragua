using System.Net;
using System.Text.Json;
using FluentValidation;

namespace LegalNic.Api.Middleware;

public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    private readonly RequestDelegate _next = next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger = logger;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unhandled exception while processing request.");
            await WriteErrorResponseAsync(context, exception);
        }
    }

    private static async Task WriteErrorResponseAsync(HttpContext context, Exception exception)
    {
        var (statusCode, error) = exception switch
        {
            ValidationException validationException => (
                StatusCodes.Status400BadRequest,
                string.Join(" ", validationException.Errors.Select(error => error.ErrorMessage))),
            UnauthorizedAccessException => (
                StatusCodes.Status401Unauthorized,
                exception.Message),
            InvalidOperationException => (
                StatusCodes.Status400BadRequest,
                exception.Message),
            KeyNotFoundException => (
                StatusCodes.Status404NotFound,
                exception.Message),
            _ => (
                StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.")
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new
        {
            error,
            statusCode
        });

        await context.Response.WriteAsync(payload);
    }
}
