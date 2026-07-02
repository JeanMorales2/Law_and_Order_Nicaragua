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
Server=localhost;Database=LegalNicDb;Trusted_Connection=True;TrustServerCertificate=True;
```
