using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace LegalNic.Api.Swagger;

public sealed class SwaggerExamplesOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var method = context.MethodInfo;
        var controller = method.DeclaringType?.Name ?? string.Empty;

        if (controller == "AuthController" && method.Name == "Register")
        {
            SetJsonRequestExample(operation, new OpenApiObject
            {
                ["fullName"] = new OpenApiString("Ana Lopez"),
                ["email"] = new OpenApiString("ana@legalnic.com"),
                ["phoneNumber"] = new OpenApiString("8888-1000"),
                ["password"] = new OpenApiString("Segura123"),
                ["role"] = new OpenApiString("Citizen")
            });
        }

        if (controller == "AuthController" && method.Name == "Login")
        {
            SetJsonRequestExample(operation, new OpenApiObject
            {
                ["email"] = new OpenApiString("ana@legalnic.com"),
                ["password"] = new OpenApiString("Segura123")
            });

            SetJsonResponseExample(operation, "200", new OpenApiObject
            {
                ["accessToken"] = new OpenApiString("eyJhbGciOi..."),
                ["accessTokenExpiresAtUtc"] = new OpenApiString("2026-07-09T18:30:00Z"),
                ["refreshToken"] = new OpenApiString("r4nd0m-refreshtoken"),
                ["refreshTokenExpiresAtUtc"] = new OpenApiString("2026-07-16T18:15:00Z")
            });
        }

        if (controller == "ServiceRequestsController" && method.Name == "Create")
        {
            SetJsonRequestExample(operation, new OpenApiObject
            {
                ["serviceId"] = new OpenApiInteger(12),
                ["caseDetail"] = new OpenApiString("Necesito apoyo con un traspaso vehicular.")
            });
        }

        if (controller == "ServiceRequestsController" && method.Name == "Complete")
        {
            SetJsonRequestExample(operation, new OpenApiObject
            {
                ["agreedPrice"] = new OpenApiDouble(1500)
            });
        }

        if (controller == "ServiceRequestsController" && method.Name == "CreateReview")
        {
            SetJsonRequestExample(operation, new OpenApiObject
            {
                ["rating"] = new OpenApiInteger(5),
                ["comment"] = new OpenApiString("Atencion clara y rapida durante todo el tramite.")
            });
        }

        if (controller == "ServicesController" && method.Name == "Create")
        {
            SetJsonRequestExample(operation, new OpenApiObject
            {
                ["categoryId"] = new OpenApiInteger(3),
                ["name"] = new OpenApiString("Divorcio por mutuo acuerdo"),
                ["description"] = new OpenApiString("Asesoria y acompanamiento hasta sentencia."),
                ["price"] = new OpenApiDouble(3500),
                ["priceType"] = new OpenApiString("Fixed"),
                ["estimatedDays"] = new OpenApiInteger(7),
                ["requiredDocuments"] = new OpenApiString("Cedulas, acta de matrimonio y partidas.")
            });
        }

        if (controller == "LawyersController" && method.Name == "ReplaceMyAvailability")
        {
            SetJsonRequestExample(operation, new OpenApiArray
            {
                new OpenApiObject
                {
                    ["dayOfWeek"] = new OpenApiString("Monday"),
                    ["isActive"] = new OpenApiBoolean(true),
                    ["startTime"] = new OpenApiString("09:00:00"),
                    ["endTime"] = new OpenApiString("17:00:00")
                },
                new OpenApiObject
                {
                    ["dayOfWeek"] = new OpenApiString("Tuesday"),
                    ["isActive"] = new OpenApiBoolean(true),
                    ["startTime"] = new OpenApiString("09:00:00"),
                    ["endTime"] = new OpenApiString("17:00:00")
                }
            });
        }
    }

    private static void SetJsonRequestExample(OpenApiOperation operation, IOpenApiAny example)
    {
        var jsonContent = operation.RequestBody?.Content?
            .FirstOrDefault(item => item.Key.Contains("json", StringComparison.OrdinalIgnoreCase)).Value;

        if (jsonContent is not null)
        {
            jsonContent.Example = example;
        }
    }

    private static void SetJsonResponseExample(OpenApiOperation operation, string statusCode, IOpenApiAny example)
    {
        if (!operation.Responses.TryGetValue(statusCode, out var response))
        {
            return;
        }

        var jsonContent = response.Content
            .FirstOrDefault(item => item.Key.Contains("json", StringComparison.OrdinalIgnoreCase)).Value;

        if (jsonContent is not null)
        {
            jsonContent.Example = example;
        }
    }
}
