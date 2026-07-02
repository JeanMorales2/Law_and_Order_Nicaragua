using System.Reflection;
using LegalNic.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace LegalNic.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(HealthResponse), StatusCodes.Status200OK)]
    [SwaggerOperation(
        Summary = "Obtiene el estado del servicio",
        Description = "Devuelve el estado actual del backend LegalNic y la version publicada.")]
    public ActionResult<HealthResponse> Get()
    {
        var version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "1.0.0";

        return Ok(new HealthResponse("Healthy", version));
    }
}
