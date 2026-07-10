# LegalNic Backend

Backend base de **LegalNic** construido con ASP.NET Core (.NET 8) y organizado por capas:

- `LegalNic.Api`: API HTTP, controladores, Swagger y configuracion de arranque.
- `LegalNic.Application`: capa de aplicacion y casos de uso.
- `LegalNic.Domain`: capa de dominio.
- `LegalNic.Infrastructure`: integraciones y acceso a infraestructura externa.

## Requisitos

- .NET SDK 8.0 o superior con soporte para `net8.0`

## Como correr el proyecto

1. Restaurar dependencias:

```bash
dotnet restore
```

2. Ejecutar la API:

```bash
dotnet run --project LegalNic.Api
```

3. Abrir Swagger en el navegador:

- `https://localhost:7210/swagger`
- `http://localhost:5102/swagger`

## Endpoint inicial

- `GET /api/health`: devuelve el estado del servicio y su version.

## Configuracion

La cadena de conexion se configura en:

- `LegalNic.Api/appsettings.json`
- `LegalNic.Api/appsettings.Development.json`

Valor de desarrollo actual:

```text
Server=(localdb)\MSSQLLocalDB;Database=LegalNicDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;
```

## Checklist de seguridad revisada

- [x] JWT sin exposición de `PasswordHash` ni campos internos de Identity en DTOs de respuesta.
- [x] Rate limiting básico aplicado a `POST /api/auth/login` por IP.
- [x] Redirección HTTPS forzada con código `308` y `HSTS` fuera de `Development`.
- [x] Cabeceras de seguridad agregadas (`X-Content-Type-Options`, `X-Frame-Options`, `CSP`, `Referrer-Policy`, `Permissions-Policy`).
- [x] Validación estricta de documentos subidos por firma real del archivo y tipo MIME permitido.
- [x] Notificaciones por email desacopladas del negocio mediante `INotificationService`.
- [x] Stub de `IPushNotificationService` listo para integración futura con FCM.
- [x] Swagger enriquecido con ejemplos de request/response para endpoints principales.
