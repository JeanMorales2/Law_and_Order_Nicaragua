using LegalNic.Domain.Entities;
using LegalNic.Domain.Enums;
using LegalNic.Infrastructure.Auth;
using LegalNic.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LegalNic.Infrastructure.Seed;

public static class DbSeeder
{
    public static async Task SeedAsync(
        LegalNicDbContext context,
        RoleManager<IdentityRole<int>> roleManager,
        CancellationToken cancellationToken = default)
    {
        await SeedRolesAsync(roleManager);
        await SeedCategoriesAsync(context, cancellationToken);
        await SeedLawyersAsync(context, cancellationToken);
    }

    private static async Task SeedRolesAsync(RoleManager<IdentityRole<int>> roleManager)
    {
        foreach (var roleName in Enum.GetNames<UserRole>())
        {
            if (await roleManager.RoleExistsAsync(roleName))
            {
                continue;
            }

            await roleManager.CreateAsync(new IdentityRole<int>(roleName));
        }
    }

    private static async Task SeedCategoriesAsync(
        LegalNicDbContext context,
        CancellationToken cancellationToken)
    {
        if (await context.ServiceCategories.AnyAsync(cancellationToken))
        {
            return;
        }

        var createdAt = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc);

        var categories = new[]
        {
            new ServiceCategory
            {
                Name = "Vehículos",
                Description = "Servicios legales relacionados con compra, venta, traspasos y reclamos vehiculares.",
                CreatedAt = createdAt
            },
            new ServiceCategory
            {
                Name = "Familia",
                Description = "Asesoría y representación en divorcios, pensiones y procesos familiares.",
                CreatedAt = createdAt
            },
            new ServiceCategory
            {
                Name = "Laboral",
                Description = "Procesos y asesoría sobre despidos, prestaciones y conflictos laborales.",
                CreatedAt = createdAt
            },
            new ServiceCategory
            {
                Name = "Mercantil",
                Description = "Constitución de empresas, contratos y gestiones comerciales.",
                CreatedAt = createdAt
            },
            new ServiceCategory
            {
                Name = "Penal",
                Description = "Defensa, denuncias y acompañamiento en procesos penales.",
                CreatedAt = createdAt
            },
            new ServiceCategory
            {
                Name = "Notarial",
                Description = "Protocolización, autenticaciones, poderes y otros actos notariales.",
                CreatedAt = createdAt
            }
        };

        await context.ServiceCategories.AddRangeAsync(categories, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedLawyersAsync(
        LegalNicDbContext context,
        CancellationToken cancellationToken)
    {
        if (await context.LawyerProfiles.AnyAsync(cancellationToken))
        {
            return;
        }

        var createdAt = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc);

        var vehicleCategory = await context.ServiceCategories.SingleAsync(
            category => category.Name == "Vehículos",
            cancellationToken);

        var familyCategory = await context.ServiceCategories.SingleAsync(
            category => category.Name == "Familia",
            cancellationToken);

        var laborCategory = await context.ServiceCategories.SingleAsync(
            category => category.Name == "Laboral",
            cancellationToken);

        var mercantileCategory = await context.ServiceCategories.SingleAsync(
            category => category.Name == "Mercantil",
            cancellationToken);

        var penalCategory = await context.ServiceCategories.SingleAsync(
            category => category.Name == "Penal",
            cancellationToken);

        var notarialCategory = await context.ServiceCategories.SingleAsync(
            category => category.Name == "Notarial",
            cancellationToken);

        var marioUser = new User
        {
            FullName = "Lic. Mario Sequeira",
            Email = "mario.sequeira@legalnic.local",
            PhoneNumber = "8888-1101",
            Role = UserRole.Lawyer,
            IsVerified = true,
            CreatedAt = createdAt,
            LawyerProfile = new LawyerProfile
            {
                BarNumber = "CSJ-2014-00981",
                University = "Universidad Centroamericana",
                IsStudent = false,
                YearsExperience = 8,
                Bio = "Especialista en gestiones vehiculares y notariales en Managua.",
                Department = "Managua",
                Municipality = "Managua",
                VerificationStatus = VerificationStatus.Verified,
                CreatedAt = createdAt,
                Services =
                [
                    new Service
                    {
                        Name = "Compra y venta de vehículo",
                        Description = "Acompañamiento legal en compraventa, revisión documental y traspaso inicial.",
                        Price = 1500m,
                        PriceType = PriceType.Range,
                        EstimatedDays = 3,
                        RequiredDocuments =
                            "Cédula de comprador y vendedor, circulación, matrícula, compraventa y solvencia municipal.",
                        IsActive = true,
                        CategoryId = vehicleCategory.Id,
                        CreatedAt = createdAt
                    },
                    new Service
                    {
                        Name = "Traspaso vehicular",
                        Description = "Gestión integral del traspaso ante las autoridades correspondientes.",
                        Price = 2200m,
                        PriceType = PriceType.Fixed,
                        EstimatedDays = 4,
                        RequiredDocuments =
                            "Cédula, circulación, matrícula, solvencias y minuta firmada.",
                        IsActive = true,
                        CategoryId = notarialCategory.Id,
                        CreatedAt = createdAt
                    }
                ]
            }
        };

        var andreaUser = new User
        {
            FullName = "Lic. Andrea Mairena",
            Email = "andrea.mairena@legalnic.local",
            PhoneNumber = "8888-1102",
            Role = UserRole.Lawyer,
            IsVerified = true,
            CreatedAt = createdAt,
            LawyerProfile = new LawyerProfile
            {
                BarNumber = "CSJ-2016-01427",
                University = "Universidad Nacional Autónoma de Nicaragua",
                IsStudent = false,
                YearsExperience = 6,
                Bio = "Abogada con práctica en derecho de familia y conflictos laborales.",
                Department = "León",
                Municipality = "León",
                VerificationStatus = VerificationStatus.Verified,
                CreatedAt = createdAt,
                Services =
                [
                    new Service
                    {
                        Name = "Divorcio por mutuo acuerdo",
                        Description = "Preparación de demanda, acuerdos y acompañamiento hasta sentencia.",
                        Price = 3500m,
                        PriceType = PriceType.Fixed,
                        EstimatedDays = 7,
                        RequiredDocuments =
                            "Acta de matrimonio, cédulas, partida de nacimiento de hijos y propuesta de acuerdo.",
                        IsActive = true,
                        CategoryId = familyCategory.Id,
                        CreatedAt = createdAt
                    },
                    new Service
                    {
                        Name = "Reclamo de prestaciones laborales",
                        Description = "Cálculo de liquidación y representación en conciliación o demanda.",
                        Price = 2000m,
                        PriceType = PriceType.Range,
                        EstimatedDays = 5,
                        RequiredDocuments =
                            "Contrato, colillas de pago, cédula y constancias laborales.",
                        IsActive = true,
                        CategoryId = laborCategory.Id,
                        CreatedAt = createdAt
                    }
                ]
            }
        };

        var carlosUser = new User
        {
            FullName = "Br. Carlos Gutiérrez",
            Email = "carlos.gutierrez@legalnic.local",
            PhoneNumber = "8888-1103",
            Role = UserRole.Student,
            IsVerified = false,
            CreatedAt = createdAt,
            LawyerProfile = new LawyerProfile
            {
                BarNumber = "CSJ-EST-2026-0007",
                University = "Universidad Americana",
                IsStudent = true,
                YearsExperience = 1,
                Bio = "Estudiante avanzado con acompañamiento supervisado en trámites mercantiles y penales básicos.",
                Department = "Masaya",
                Municipality = "Masaya",
                VerificationStatus = VerificationStatus.Pending,
                CreatedAt = createdAt,
                Services =
                [
                    new Service
                    {
                        Name = "Redacción de contrato mercantil básico",
                        Description = "Borrador y revisión inicial de contratos comerciales simples.",
                        Price = 1200m,
                        PriceType = PriceType.Fixed,
                        EstimatedDays = 3,
                        RequiredDocuments =
                            "Datos de las partes, objeto del contrato y condiciones comerciales.",
                        IsActive = true,
                        CategoryId = mercantileCategory.Id,
                        CreatedAt = createdAt
                    },
                    new Service
                    {
                        Name = "Orientación inicial en denuncia penal",
                        Description = "Acompañamiento para organizar hechos, documentos y ruta procesal inicial.",
                        Price = 900m,
                        PriceType = PriceType.Hourly,
                        EstimatedDays = 2,
                        RequiredDocuments =
                            "Relato de hechos, cédula y evidencia documental disponible.",
                        IsActive = true,
                        CategoryId = penalCategory.Id,
                        CreatedAt = createdAt
                    }
                ]
            }
        };

        await context.Users.AddRangeAsync([marioUser, andreaUser, carlosUser], cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
