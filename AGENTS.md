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

- Solución actual: `LegalNic.Api`, `LegalNic.Application`, `LegalNic.Domain`, `LegalNic.Infrastructure`, `LegalNic.Tests`, `LegalNic.Mobile`.
- Registro principal de servicios:
  - `LegalNic.Application/DependencyInjection.cs`
  - `LegalNic.Infrastructure/DependencyInjection.cs`
- `LegalNicDbContext` vive en `LegalNic.Infrastructure/Persistence`.
- Las configuraciones EF por entidad viven en `LegalNic.Infrastructure/Persistence/Configurations`.
- Las migraciones viven en `LegalNic.Infrastructure/Persistence/Migrations`.
- El cliente móvil vive en `LegalNic.Mobile` como proyecto Expo + TypeScript separado del backend.
- La estructura base del móvil está organizada por feature horizontal en:
  - `src/screens`
  - `src/components`
  - `src/navigation`
  - `src/services/api`
  - `src/store`
  - `src/theme`
  - `src/hooks`

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
- El backend expone SignalR para tiempo real en `hubs/chat`.
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

### 3.3.1 Convenciones del móvil

- La app Expo usa `React Navigation` con una pila raíz en `src/navigation/RootNavigator.tsx`.
- La navegación del móvil ya distingue entre flujo autenticado y no autenticado:
  - `Splash`
  - `Login`
  - `Register`
  - `App` (tabs por rol)
- Los tabs actuales por rol quedaron definidos así:
  - `Citizen`: `Home`, `Solicitudes`, `Mensajes`, `Cuenta`
  - `Lawyer` / `Student`: `Dashboard`, `Servicios`, `Solicitudes`, `Cuenta`
- `React Query` se configura globalmente en `App.tsx` con `QueryClientProvider`.
- `Zustand` se usa para estado local y de sesión. El store principal de autenticación es `src/store/authStore.ts`.
- El acceso HTTP del móvil entra por `src/services/api/client.ts`; las pantallas no deben hacer `fetch` directo.
- El cliente HTTP del móvil usa `axios`, no `fetch`.
- Los tokens del móvil se guardan exclusivamente con `expo-secure-store`; no usar `AsyncStorage` para credenciales.
- El cliente Axios agrega automáticamente el `Bearer accessToken` y, ante `401`, intenta refrescar sesión con `POST /api/auth/refresh-token` antes de reintentar la solicitud original.
- La identidad real del usuario autenticado se resuelve contra `GET /api/users/me`, porque el `login` del backend no devuelve el rol ni el perfil.
- Los componentes base reutilizables viven en `src/components` y hoy incluyen:
  - `Button`
  - `ScreenHeader`
  - `StatusPill`
  - `Stars`
  - `Chip`
  - `Card`
  - `Field`
  - `Input`
  - `BottomTabBar`
  - `VerificationBanner`

### 3.3.2 Sistema de diseño móvil

- La paleta oficial del móvil vive en `LegalNic.Mobile/src/theme/colors.ts` y usa exactamente:
  - `navy #1B2A4A`
  - `navyDeep #12203B`
  - `navySoft #2C3E63`
  - `gold #B98B34`
  - `goldSoft #F1ECE0`
  - `paper #FAF7F1`
  - `ink #24262B`
  - `inkSoft #6B6E76`
  - `line #E7E1D6`
  - `verde #3F7A5C`
  - `rojo #A23B3B`
- Tipografía del móvil:
  - `Fraunces` para títulos y nombres
  - `Work Sans` para cuerpo y acciones
- Las fuentes se cargan en `src/hooks/useAppFonts.ts` mediante `expo-font`, `@expo-google-fonts/fraunces` y `@expo-google-fonts/work-sans`.
- El theme compartido se centraliza en `src/theme/index.ts` y expone `colors`, `typography`, `spacing`, `radii` y `shadows`.

### 3.4 Validaciones

- Las validaciones se implementan con `FluentValidation`.
- Los validadores viven junto al request correspondiente en `Application`, excepto formularios HTTP específicos del transporte como `UploadVerificationDocumentFormValidator`, que viven en `Api/Models`.
- Se registran con `AddValidatorsFromAssembly(...)`.
- `Program.cs` usa `AddFluentValidationAutoValidation()`.
- Las respuestas de validación terminan como `400 Bad Request` con payload JSON `{ error, statusCode }`.
- En SignalR, errores de validación/autorización del hub se traducen a `HubException` con mensaje legible para el cliente.
- Los archivos de verificación no se validan solo por extensión: `LocalFileStorageService` exige coincidencia entre extensión permitida, MIME permitido y firma real del archivo mediante `FileSignatureValidator`.

### 3.5 Manejo de errores

- El manejo centralizado de errores está en `LegalNic.Api/Middleware/GlobalExceptionMiddleware.cs`.
- Mapeo actual:
  - `ValidationException` -> `400`
  - `ConflictException` -> `409`
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
  - `IsActive`
  - `IsVerified`
- El registro crea primero el `User` de dominio y luego el `ApplicationUser` de Identity dentro de transacción.
- La autenticación es JWT Bearer y maneja refresh tokens persistidos en base.
- El login y refresh token rechazan usuarios suspendidos (`User.IsActive = false`).
- `POST /api/auth/login` tiene rate limiting por IP con política `login` usando ventana fija de 5 intentos por 5 minutos.

### 3.7 Seguridad HTTP y documentación

- `Program.cs` fuerza `HTTPS` con redirección `308`; fuera de `Development` también aplica `HSTS`.
- El middleware `SecurityHeadersMiddleware` agrega como mínimo:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Content-Security-Policy`
- Swagger se genera con `Swashbuckle` y ejemplos concretos mediante `SwaggerExamplesOperationFilter` para endpoints principales de autenticación, servicios, solicitudes, reseñas y disponibilidad.
- Los DTOs de respuesta no deben exponer `PasswordHash`, hashes de refresh token, signing keys ni campos internos de `ApplicationUser`.

### 3.8 Entity Framework Core y migraciones

- El `DbContext` se registra con `UseSqlServer(...)`.
- `LegalNicDbContextFactory` existe para operaciones design-time de EF Core.
- Las migraciones usan el ensamblado de `LegalNic.Infrastructure`.
- Migraciones actuales:
  - `20260702050113_InitialCreate`
  - `20260702050756_AddPlatformCommissions`
  - `20260706043516_AddIdentityAuthentication`
  - `20260709120000_AddUserIsActive`
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

### 4.3 Chat en tiempo real

- El chat está modelado sobre la entidad `Message` existente:
  - `ServiceRequestId`
  - `SenderId`
  - `Content`
  - `AttachmentUrl`
  - `SentAt`
  - `IsRead`
- La conversación pertenece a una `ServiceRequest`; no existe una entidad de chat separada.
- El acceso a la conversación se valida contra los participantes reales de la solicitud:
  - cliente (`ServiceRequest.ClientId`)
  - abogado/estudiante dueño del servicio (`ServiceRequest.Service.LawyerProfile.UserId`)
  - admin
- Endpoints y hub actuales:
  - `GET /api/requests/{id}/messages`
  - `PUT /api/requests/{id}/messages/read`
  - `SignalR Hub: /hubs/chat`
- El hub soporta:
  - `JoinRequestGroup(requestId)`
  - `SendMessage(requestId, content)`
- Los mensajes se emiten al evento `ReceiveMessage`.
- El marcado de lectura actual marca como leídos los mensajes no leídos cuyo remitente sea otro usuario cuando el destinatario abre el chat y ejecuta `PUT /messages/read`.

### 4.4 Reseñas

- La entidad `Review` sigue siendo 1:1 con `ServiceRequest`; una solicitud tiene como máximo una reseña.
- Crear reseña ocurre vía `POST /api/requests/{id}/review`.
- Reglas implementadas:
  - solo el cliente dueño de la solicitud puede reseñar
  - la solicitud debe estar en estado `Completed`
  - si ya existe reseña para esa solicitud, la API responde `409 Conflict`
- Lectura pública de reseñas:
  - `GET /api/lawyers/{id}/reviews`
- El promedio y total de reseñas por abogado se calculan desde una consulta reutilizable compartida en infraestructura y esa misma fuente alimenta:
  - perfil público del abogado
  - búsqueda de servicios

### 4.5 Disponibilidad

- La disponibilidad se modela con la entidad `Availability` por `LawyerProfileId` y `DayOfWeek`.
- Endpoints actuales:
  - `GET /api/lawyers/me/availability`
  - `PUT /api/lawyers/me/availability`
- El `PUT` reemplaza los 7 días completos de una vez y valida:
  - exactamente 7 entradas
  - un día único por cada `DayOfWeek`
  - `EndTime > StartTime` cuando el día está activo

### 4.6 Administración

- Todos los endpoints bajo `/api/admin/*` exigen rol `Admin`.
- Módulos administrativos actuales:
  - `api/admin/categories`
  - `api/admin/users`
  - `api/admin/metrics`
  - `api/admin/commissions`
  - `api/admin/verifications`
- La suspensión de usuarios se implementa con `User.IsActive = false` y revocación de refresh tokens activos.

### 4.7 Comisiones

- Estado de cuenta del abogado:
  - `GET /api/lawyers/me/commissions`
- Gestión administrativa:
  - `GET /api/admin/commissions`
  - `PUT /api/admin/commissions/{id}/mark-paid`
- `mark-paid` cambia `Status = Paid` y `SettledAt = UtcNow`.
- El panel de métricas administrativas incluye totales globales y desglose mensual de comisiones para los últimos 6 meses.

### 4.8 Notificaciones

- El contrato de notificaciones de negocio vive en `LegalNic.Application/Notifications`.
- `INotificationService` cubre estos eventos:
  - nueva solicitud recibida
  - solicitud aceptada
  - solicitud rechazada
  - solicitud finalizada
  - nuevo mensaje de chat
- La implementación inicial es `MailKitEmailNotificationService` en infraestructura y lee su configuración desde la sección `Notifications`.
- Si `SmtpHost` o `FromEmail` no están configurados, el servicio registra el intento y no rompe el flujo principal.
- Las notificaciones por chat aplican throttling en memoria por solicitud y destinatario usando `ChatEmailThrottleMinutes`.
- `IPushNotificationService` existe como puerto preparado para futura integración con Firebase Cloud Messaging; la implementación actual es un stub controlado por logs.

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
- Chat en tiempo real con SignalR, historial REST y marcado de mensajes como leídos.
- Módulo de reseñas con creación por solicitud completada y listado paginado por abogado.
- Módulo de disponibilidad semanal para abogado/estudiante.
- Panel administrativo para categorías, usuarios, métricas y comisiones.
- Estado de cuenta de comisiones para abogado/estudiante.
- Modelo de comisiones de plataforma con pruebas automáticas sobre el completado de solicitudes.
- Seed de roles y datos base.
- Configuración EF Core con SQL Server / LocalDB para desarrollo.
- Notificaciones iniciales por email y endurecimiento base de seguridad HTTP/API.
- Fundación del cliente móvil en Expo + TypeScript con navigation raíz, React Query, Zustand, sistema de diseño y pantalla `Styleguide`.
- Cliente móvil conectado al backend real para autenticación, bootstrap de sesión, refresco automático de JWT y navegación por rol.

### 6.2 Áreas que todavía no aparecen completas o expuestas

- La integración real de push notifications con FCM todavía está pendiente; hoy solo existe el contrato y un stub.
- Las notificaciones por email requieren credenciales SMTP reales en configuración para enviar correos fuera del entorno local.
- El cliente móvil ya tiene `Splash`, `Login`, `Register` y tabs por rol, pero las pantallas de negocio dentro de tabs siguen mayormente como placeholders visuales conectados a la sesión real.
- El archivo `LegalNic_Demo.jsx` no estaba presente en el workspace al crear esta base móvil, así que la primera iteración visual se apoyó en la guía de color/tipografía validada y no en una comparación pixel-perfect contra ese archivo.

## 7. Notas de mantenimiento

- `README.md` todavía puede quedar desalineado con algunos detalles actuales de desarrollo si cambia la configuración; usar el código y este archivo como referencia principal.
- Antes de cambiar comportamiento de arranque, autenticación, migraciones o contratos HTTP, actualizar este documento si la decisión pasa a ser una convención del proyecto.
