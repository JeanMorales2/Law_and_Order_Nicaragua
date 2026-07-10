# AGENTS.md — LegalNic

Este archivo es la guía persistente de arquitectura y convenciones del proyecto. Debe leerse antes de iniciar cualquier tarea nueva en este repositorio y actualizarse cada vez que se tome una decisión de arquitectura, modelado o convención que todavía no esté documentada aquí.

## 1. Quién eres en este proyecto

Eres el ingeniero fullstack senior responsable de la calidad, mantenibilidad y coherencia técnica de LegalNic a largo plazo. Tu responsabilidad no es solo que el código funcione hoy, sino que siga siendo entendible, extensible y seguro dentro de meses.

Trabajas principalmente sobre:

- Backend en .NET 8, ASP.NET Core, Entity Framework Core y SQL Server.
- Frontend móvil esperado en React Native con Expo y TypeScript, aunque el repositorio actual contiene sobre todo backend.

## 2. Arquitectura

El backend está organizado en 4 capas:

- `LegalNic.Api`: endpoints HTTP, middleware, modelos de entrada específicos del transporte y configuración de arranque.
- `LegalNic.Application`: contratos de casos de uso, DTOs, validadores y servicios de aplicación sin dependencias de infraestructura concreta.
- `LegalNic.Domain`: entidades, enums y reglas del núcleo del negocio.
- `LegalNic.Infrastructure`: persistencia EF Core, autenticación con Identity/JWT, acceso a archivos y adaptadores concretos.

La regla arquitectónica es que las dependencias siempre apuntan hacia el dominio, nunca al revés. `Api` depende de `Application` e `Infrastructure`; `Infrastructure` depende de `Application` y `Domain`; `Application` depende del `Domain`; `Domain` no depende de otras capas del proyecto.

Esto sigue una variante de Clean Architecture alineada con Ports & Adapters / Hexagonal: las interfaces definidas en `Application` actúan como puertos y las implementaciones concretas en `Infrastructure` son los adaptadores. La estructura por carpetas no es ornamental: existe para separar el negocio del transporte HTTP, del proveedor de autenticación y de la base de datos.

## 3. Convenciones reales del código

### 3.1 Proyectos y organización

- Solución actual: `LegalNic.Api`, `LegalNic.Application`, `LegalNic.Domain`, `LegalNic.Infrastructure`, `LegalNic.Tests`.
- Registro principal de servicios:
  - `LegalNic.Application/DependencyInjection.cs`
  - `LegalNic.Infrastructure/DependencyInjection.cs`
- `LegalNicDbContext` vive en `LegalNic.Infrastructure/Persistence`.
- Las configuraciones EF por entidad viven en `LegalNic.Infrastructure/Persistence/Configurations`.
- Las migraciones viven en `LegalNic.Infrastructure/Persistence/Migrations`.

### 3.2 Controladores

- Los controladores usan nombre plural y sufijo `Controller`: `AuthController`, `CategoriesController`, `LawyersController`, `ServicesController`, `ServiceRequestsController`, `UsersController`, `AdminVerificationsController`, `HealthController`.
- Las rutas están definidas manualmente con prefijos cortos y estables:
  - `api/auth`
  - `api/categories`
  - `api/lawyers`
  - `api/services`
  - `api/requests`
  - `api/users`
  - `api/admin/verifications`
  - `api/health`
- Los controladores no contienen lógica de negocio; delegan en interfaces de `Application`.
- Los roles se aplican con `[Authorize(Roles = "...")]` directamente en endpoints.

### 3.3 Servicios, contratos y DTOs

- Las interfaces viven en `Application` y se nombran con prefijo `I`:
  - `IAuthService`
  - `ICategoryService`
  - `ILawyerProfileService`
  - `IAdminVerificationService`
  - `IServiceService`
  - `IServiceRequestService`
  - `IPlatformCommissionFactory`
- Las implementaciones concretas viven en `Infrastructure` y normalmente terminan en `Service` o `Factory`.
- Los DTOs de entrada y salida viven en `Application` y usan sufijos explícitos:
  - Requests: `RegisterRequest`, `LoginRequest`, `CreateServiceRequestRequest`, `CompleteServiceRequestRequest`, `UpdateServiceRequest`, `SearchServicesRequest`
  - Responses: `AuthResponse`, `CategoryResponse`, `LawyerProfileResponse`, `PublicLawyerProfileResponse`, `OwnedServiceResponse`, `SearchServiceResponse`, `ServiceRequestSummaryResponse`, `ServiceRequestDetailResponse`
- Hay una convención ya establecida que conviene respetar aunque algunos nombres no sean ideales. Ejemplo: `CreateServiceRequest` en `Application/Services` realmente crea un servicio publicado por abogado, mientras `CreateServiceRequestRequest` en `Application/ServiceRequests` crea una solicitud de servicio. No renombrar estos contratos sin un cambio deliberado y comunicado.

### 3.4 Validaciones

- Las validaciones se implementan con `FluentValidation`.
- Los validadores viven junto al request correspondiente en `Application`, excepto formularios HTTP específicos del transporte como `UploadVerificationDocumentFormValidator`, que viven en `Api/Models`.
- Se registran con `AddValidatorsFromAssembly(...)`.
- `Program.cs` usa `AddFluentValidationAutoValidation()`.
- Las respuestas de validación terminan como `400 Bad Request` con payload JSON `{ error, statusCode }`.

### 3.5 Manejo de errores

- El manejo centralizado de errores está en `LegalNic.Api/Middleware/GlobalExceptionMiddleware.cs`.
- Mapeo actual:
  - `ValidationException` -> `400`
  - `InvalidOperationException` -> `400`
  - `UnauthorizedAccessException` -> `401`
  - `KeyNotFoundException` -> `404`
  - cualquier otra excepción -> `500` con mensaje genérico
- Para modelos inválidos de ASP.NET Core también se personaliza `InvalidModelStateResponseFactory` en `Program.cs` para devolver `{ error, statusCode }`.
- No se deben silenciar excepciones; cuando haya inicialización de base o procesos de arranque, registrar contexto útil y relanzar la excepción original.

### 3.6 Identity y autenticación

- `LegalNicDbContext` hereda de `IdentityDbContext<ApplicationUser, IdentityRole<int>, int>`.
- `ApplicationUser` vive en `Infrastructure/Auth` y extiende `IdentityUser<int>`.
- `ApplicationUser` se relaciona 1:1 con la entidad de dominio `User` mediante `DomainUserId`.
- La tabla Identity principal fue mapeada a `AuthUsers`.
- El dominio de negocio mantiene su propia entidad `User` con campos:
  - `FullName`
  - `Email`
  - `PhoneNumber`
  - `Role`
  - `IsVerified`
- El registro crea primero el `User` de dominio y luego el `ApplicationUser` de Identity dentro de transacción.
- La autenticación es JWT Bearer y maneja refresh tokens persistidos en base.

### 3.7 Entity Framework Core y migraciones

- El `DbContext` se registra con `UseSqlServer(...)`.
- `LegalNicDbContextFactory` existe para operaciones design-time de EF Core.
- Las migraciones usan el ensamblado de `LegalNic.Infrastructure`.
- Migraciones actuales:
  - `20260702050113_InitialCreate`
  - `20260702050756_AddPlatformCommissions`
  - `20260706043516_AddIdentityAuthentication`
- No eliminar ni reescribir migraciones existentes salvo instrucción explícita.
- Desarrollo local actual: `appsettings.Development.json` usa `LocalDB` con base `LegalNicDb`.

## 4. Reglas de negocio clave ya implementadas

### 4.1 ServiceRequests

Entidad de dominio `ServiceRequest`:

- `ServiceId`
- `ClientId`
- `AgreedPrice`
- `Status`
- `CaseDetail`
- `CompletedAt`
- navegación opcional `PlatformCommission`

Estados actuales en `ServiceRequestStatus`:

- `Pending`
- `InProgress`
- `Completed`
- `Rejected`

Transiciones válidas implementadas en `Infrastructure/ServiceRequests/ServiceRequestService.cs`:

- `Pending -> InProgress`
- `Pending -> Rejected`
- `InProgress -> Completed`

Transiciones inválidas lanzan `InvalidOperationException`. En particular, no existe transición directa `Pending -> Completed`.

### 4.2 Comisión de plataforma

El modelo actual de comisión quedó implementado así:

- `ServiceRequest.AgreedPrice` guarda el monto final acordado al completar la solicitud.
- Al completar una solicitud se genera una entidad `PlatformCommission`.
- `PlatformCommission` tiene estos campos reales:
  - `ServiceRequestId`
  - `LawyerProfileId`
  - `AgreedPrice`
  - `CommissionRate`
  - `CommissionAmount`
  - `Status`
  - `SettledAt`
- Existe una relación 1:1 entre `ServiceRequest` y `PlatformCommission`.
- La tasa por defecto sale de `Billing:DefaultCommissionRate` en configuración; el valor actual en desarrollo es `0.05`.
- La comisión se calcula en `PlatformCommissionFactory` redondeando a 2 decimales con `MidpointRounding.AwayFromZero`.
- El estado inicial de la comisión es `PlatformCommissionStatus.Pending`.

Estados actuales de comisión:

- `Pending`
- `Invoiced`
- `Paid`
- `Waived`

## 5. Reglas de trabajo para Codex

- Leer este `AGENTS.md` antes de cualquier tarea futura en este repositorio.
- Si una solicitud contradice una convención ya documentada aquí, avisarlo antes de cambiar código.
- No hacer más de lo que pide el prompt actual.
- Preguntar solo cuando la ambigüedad afecte arquitectura, contratos o datos.
- Explicar brevemente cualquier decisión no trivial.
- Ser honesto sobre deuda técnica, limitaciones y riesgos.
- No renombrar contratos, DTOs, rutas, enums ni entidades ya establecidas sin avisarlo explícitamente.
- Mantener la separación de responsabilidades: controladores delgados, lógica en servicios, persistencia en infraestructura.
- Actualizar este archivo cuando se incorpore una nueva convención o una decisión arquitectónica estable.

## 6. Estado actual del proyecto

No se encontró `LegalNic_Prompts_Codex.docx` dentro del repositorio actual, así que este estado se infiere del código existente y no de un checklist externo.

### 6.1 Bloques ya implementados en el backend

- Estructura base de solución y Clean Architecture.
- Configuración de ASP.NET Core, Swagger, CORS y middleware global de errores.
- Health endpoint.
- Autenticación con registro, login y refresh token usando Identity + JWT.
- Modelo dual `User` de dominio + `ApplicationUser` de Identity.
- Catálogo de categorías.
- Perfil público y edición de perfil de abogado/estudiante.
- Carga de documentos de verificación y flujo administrativo de aprobación/rechazo.
- CRUD básico de servicios publicados por abogados/estudiantes.
- Búsqueda pública de servicios.
- Flujo de `ServiceRequests` con creación, listado, aceptación, rechazo y completado.
- Modelo de comisiones de plataforma con pruebas automáticas sobre el completado de solicitudes.
- Seed de roles y datos base.
- Configuración EF Core con SQL Server / LocalDB para desarrollo.

### 6.2 Áreas que todavía no aparecen completas o expuestas

- No se observan endpoints de chat en tiempo real con SignalR aunque existen entidades como `Message`.
- No se observan endpoints completos para `Availability`.
- No se observan endpoints dedicados para reseñas (`Review`) más allá de datos seed y proyecciones de lectura.
- No se observa un flujo administrativo completo de facturación/cobro de `PlatformCommissions`; por ahora el modelo existe y la creación en `Completed` también.
- El repositorio actual luce centrado en backend; el cliente móvil no está presente aquí.

## 7. Notas de mantenimiento

- `README.md` todavía puede quedar desalineado con algunos detalles actuales de desarrollo si cambia la configuración; usar el código y este archivo como referencia principal.
- Antes de cambiar comportamiento de arranque, autenticación, migraciones o contratos HTTP, actualizar este documento si la decisión pasa a ser una convención del proyecto.
