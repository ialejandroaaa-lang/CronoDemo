using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using Microsoft.AspNetCore.Identity;
using PosCrono.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddControllers(options => {
    options.Filters.Add<PosCrono.API.Filters.TrialActionFilter>();
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=cronodemo.db"));

builder.Services.AddScoped<PosCrono.API.Services.LicenseService>();

// Identity Configuration
builder.Services.AddIdentity<ApplicationUser, ApplicationRole>(options => {
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 4;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// JWT Configuration
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var key = Encoding.ASCII.GetBytes(jwtSettings.GetValue<string>("Key") ?? "SUPER_SECRET_KEY_FOR_POS_CRONO_2025");

builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options => {
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = false,
        ValidateAudience = false
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowReactApp");
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Middleware to force UTF-8 encoding on all responses
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        if (context.Response.ContentType != null && context.Response.ContentType.Contains("application/json"))
        {
            if (!context.Response.ContentType.Contains("charset=utf-8"))
            {
                context.Response.ContentType += "; charset=utf-8";
            }
        }
        return Task.CompletedTask;
    });
    await next();
});

// Global Exception Handler to catch and log all errors
app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[Global Error] {context.Request.Path}: {ex.Message}");
        Console.WriteLine(ex.StackTrace);
        if (ex.InnerException != null) Console.WriteLine($"Inner: {ex.InnerException.Message}");
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new { message = "Error interno del servidor", error = ex.Message });
    }
});

// app.UseHttpsRedirection();
app.MapControllers();

// Ensure DB is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated(); // Enabled for SQLite Demo

    /* Seeding Temporarily Disabled for Tunnel Stability */
    // context.Database.ExecuteSqlRaw(sqlPayment);
    // ...



    var sqlCompany = @"
        CREATE TABLE IF NOT EXISTS CompanyConfigurations (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            NombreEmpresa TEXT,
            RNC TEXT,
            Direccion TEXT,
            Telefono TEXT,
            Correo TEXT,
            SitioWeb TEXT,
            LogoPath TEXT,
            ImpuestoDefault DECIMAL(18,2) DEFAULT 18.00,
            MonedaPrincipal TEXT DEFAULT 'DOP'
        )";
    context.Database.ExecuteSqlRaw(sqlCompany);

    // FIX: ClientConfigurations Schema
    var sqlClientConfig = @"
        CREATE TABLE IF NOT EXISTS ClientConfigurations (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            UseAutoSequence INTEGER NOT NULL DEFAULT 1,
            UseInitials INTEGER NOT NULL DEFAULT 0,
            Initials TEXT DEFAULT 'CL',
            SequenceLength INTEGER DEFAULT 4,
            CurrentValue INTEGER DEFAULT 1,
            Separator TEXT DEFAULT '-',
            NameCase TEXT DEFAULT 'normal',
            AllowNegativeStock INTEGER NOT NULL DEFAULT 0
        );
        INSERT OR IGNORE INTO ClientConfigurations (Id, UseAutoSequence) VALUES (1, 1);
    ";
    context.Database.ExecuteSqlRaw(sqlClientConfig);

    try {
        // Seed Consumidor Final if not exists
        var sqlClient = @"
            INSERT OR IGNORE INTO Clients (Id, Code, Name, Company, TaxId, Phone, Email, Address, Status, Balance, SellerName)
            VALUES (1, 'CLIENT-0001', 'CONSUMIDOR FINAL', 'GENERAL', '000-00000-0', '000-000-0000', 'general@crono.com', 'CIUDAD', 'Active', 0, 'SISTEMA');
        ";
        context.Database.ExecuteSqlRaw(sqlClient);
    } catch (Exception ex) { Console.WriteLine($"[CLIENT SEED ERROR]: {ex.Message}"); }

    // Ensure MovimientosInventario exists
    var sqlKardex = @"
        CREATE TABLE IF NOT EXISTS MovimientosInventario (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            ArticuloId INTEGER NOT NULL,
            FechaMovimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            TipoMovimiento TEXT NOT NULL,
            Cantidad DECIMAL(18, 4) NOT NULL,
            CostoUnitario DECIMAL(18, 4) NOT NULL DEFAULT 0,
            Referencia TEXT NULL,
            Usuario TEXT NULL,
            AlmacenId INTEGER NULL,
            StockAnterior DECIMAL(18, 4) NULL,
            StockNuevo DECIMAL(18, 4) NULL,
            UnidadMedida TEXT NULL,
            CantidadOriginal DECIMAL(18, 4) NULL,
            UnidadOriginal TEXT NULL
        );
    ";
    context.Database.ExecuteSqlRaw(sqlKardex);

    /* T-SQL Not compatible with SQLite
    // Ensure StockActual exists
    var sqlStock = @"
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ArticulosMaster]') AND name = 'StockActual')
        BEGIN
             ALTER TABLE ArticulosMaster ADD StockActual decimal(18, 4) NOT NULL DEFAULT 0
        END
        
        -- Sanitize NULLs just in case
        UPDATE ArticulosMaster SET StockActual = 0 WHERE StockActual IS NULL
        ";
    context.Database.ExecuteSqlRaw(sqlStock);
    */

    // Ensure MotivosAjuste exists
    var sqlMotivos = @"
        CREATE TABLE IF NOT EXISTS MotivosAjuste (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Grupo TEXT NOT NULL,
            Codigo TEXT NOT NULL,
            Motivo TEXT NOT NULL,
            Activo INTEGER NOT NULL DEFAULT 1,
            RequiereAutorizacion INTEGER NOT NULL DEFAULT 0
        )";
    context.Database.ExecuteSqlRaw(sqlMotivos);

    // Ensure Transferencias tables exist
    var sqlTransferencias = @"
        CREATE TABLE IF NOT EXISTS TransferenciasMaster (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            NumeroTransferencia TEXT NOT NULL,
            Fecha DATETIME NOT NULL,
            AlmacenOrigenId INTEGER NOT NULL,
            AlmacenDestinoId INTEGER NOT NULL,
            Estado TEXT DEFAULT 'Completado',
            Observaciones TEXT,
            Usuario TEXT,
            FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS TransferenciasDetalle (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            TransferenciaId INTEGER NOT NULL,
            ArticuloId INTEGER NOT NULL,
            Cantidad DECIMAL(18,4) NOT NULL,
            UnidadMedida TEXT,
            CostoUnitario DECIMAL(18,4) NOT NULL
        );";
    context.Database.ExecuteSqlRaw(sqlTransferencias);

    // Ensure NCF_Secuencias exists
    var sqlNCF = @"
        CREATE TABLE IF NOT EXISTS NCF_Secuencias (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            TipoNCF TEXT NOT NULL,
            Nombre TEXT,
            Prefijo TEXT,
            Desde INTEGER DEFAULT 1,
            Hasta INTEGER DEFAULT 100000,
            Actual INTEGER DEFAULT 0,
            Activo INTEGER DEFAULT 1,
            FechaVencimiento DATETIME DEFAULT '2026-12-31'
        );

        INSERT OR IGNORE INTO NCF_Secuencias (TipoNCF, Nombre, Prefijo, Desde, Hasta, Actual, Activo, FechaVencimiento) VALUES 
        ('B01', 'Factura de Crédito Fiscal', 'B01', 1, 100000, 0, 1, '2026-12-31'),
        ('B02', 'Factura de Consumo', 'B02', 1, 100000, 0, 1, '2026-12-31'),
        ('B03', 'Notas de Débito', 'B03', 1, 100000, 0, 1, '2026-12-31'),
        ('B04', 'Notas de Crédito', 'B04', 1, 100000, 0, 1, '2026-12-31'),
        ('B11', 'Proveedor Informal', 'B11', 1, 100000, 0, 1, '2026-12-31'),
        ('B12', 'Registro Único de Ingresos', 'B12', 1, 100000, 0, 1, '2026-12-31'),
        ('B13', 'Gastos Menores', 'B13', 1, 100000, 0, 1, '2026-12-31'),
        ('B14', 'Regímenes Especiales', 'B14', 1, 100000, 0, 1, '2026-12-31'),
        ('B15', 'Comprobantes Gubernamentales', 'B15', 1, 100000, 0, 1, '2026-12-31'),
        ('B16', 'Exportaciones', 'B16', 1, 100000, 0, 1, '2026-12-31'),
        ('B17', 'Pagos al Exterior', 'B17', 1, 100000, 0, 1, '2026-12-31');
    ";
    context.Database.ExecuteSqlRaw(sqlNCF);

    /* T-SQL Not compatible with SQLite
    // Ensure CompanyConfiguration structure
    var sqlCompanyConfig = @"
        IF EXISTS (SELECT * FROM sysobjects WHERE name='CompanyConfigurations' AND xtype='U')
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[CompanyConfigurations]') AND name = 'DefaultClientId')
            BEGIN
                ALTER TABLE CompanyConfigurations ADD DefaultClientId int NULL
            END
        END";
    context.Database.ExecuteSqlRaw(sqlCompanyConfig);
    */

    // Ensure DocumentSequences
    var sqlDocSeq = @"
        CREATE TABLE IF NOT EXISTS DocumentSequences (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Code TEXT NOT NULL,
            Name TEXT NOT NULL,
            Prefix TEXT,
            CurrentValue INTEGER DEFAULT 0,
            Length INTEGER DEFAULT 6,
            LastModified DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        INSERT OR IGNORE INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length) VALUES 
        ('SALES_INVOICE', 'Factura de Venta', 'FACT-', 0, 6),
        ('PURCHASE_ORDER', 'Orden de Compra', 'OC-', 0, 6),
        ('GOODS_RECEIPT', 'Recepción de Mercancía', 'REC-', 0, 6),
        ('DIRECT_PURCHASE', 'Factura de Compra Directa', 'FD-', 0, 6);
    ";
    context.Database.ExecuteSqlRaw(sqlDocSeq);

    /* T-SQL Not compatible with SQLite
    // Ensure PrinterName in ReceiptTemplates
    var sqlReceiptPrinter = @"
        IF EXISTS (SELECT * FROM sysobjects WHERE name='ReceiptTemplates' AND xtype='U')
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ReceiptTemplates]') AND name = 'PrinterName')
            BEGIN
                ALTER TABLE ReceiptTemplates ADD PrinterName nvarchar(255) NULL
            END
        END";
    context.Database.ExecuteSqlRaw(sqlReceiptPrinter);
    */

    /* T-SQL Not compatible with SQLite
    // Ensure CantTotal in ComprasDetalle (User Request)
    var sqlCantTotal = @"
        IF EXISTS (SELECT * FROM sysobjects WHERE name='ComprasDetalle' AND xtype='U')
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[ComprasDetalle]') AND name = 'CantTotal')
            BEGIN
                ALTER TABLE ComprasDetalle ADD CantTotal decimal(18, 4) DEFAULT 0
            END
        END";
    context.Database.ExecuteSqlRaw(sqlCantTotal);
    */

    // Ensure AuditLog exists
    var sqlAudit = @"
        CREATE TABLE IF NOT EXISTS AuditLog (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            TableName TEXT NOT NULL,
            RecordId TEXT,
            Action TEXT NOT NULL,
            OldValues TEXT,
            NewValues TEXT,
            Usuario TEXT,
            Fecha DATETIME DEFAULT CURRENT_TIMESTAMP
        );";
    context.Database.ExecuteSqlRaw(sqlAudit);

    // Ensure Monedas and TasasCambio exist
    var sqlMonedas = @"
        CREATE TABLE IF NOT EXISTS Monedas (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Codigo TEXT NOT NULL,
            Nombre TEXT NOT NULL,
            Simbolo TEXT NOT NULL,
            EsFuncional INTEGER NOT NULL DEFAULT 0,
            Activo INTEGER NOT NULL DEFAULT 1
        );

        INSERT OR IGNORE INTO Monedas (Id, Codigo, Nombre, Simbolo, EsFuncional, Activo) VALUES 
        (1, 'DOP', 'Peso Dominicano', 'RD$', 1, 1),
        (2, 'USD', 'Dólar Estadounidense', 'US$', 0, 1);

        CREATE TABLE IF NOT EXISTS TasasCambio (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            MonedaId INTEGER NOT NULL,
            Tasa DECIMAL(18,4) NOT NULL,
            FechaInicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FechaFin DATETIME NULL
        );

        INSERT OR IGNORE INTO TasasCambio (MonedaId, Tasa, FechaInicio)
        SELECT 2, 60.50, CURRENT_TIMESTAMP WHERE NOT EXISTS (SELECT 1 FROM TasasCambio WHERE MonedaId = 2);
    ";
    context.Database.ExecuteSqlRaw(sqlMonedas);

    // Ensure VentasMaster has currency columns
    var sqlVentasCurrency = @"
         -- In SQLite we cannot easily add IF NOT EXISTS for columns in batch.
         -- Assuming clean DB or existing one. We try to add columns and ignore error if exist
         -- But in strict mode it throws.
         -- We can check PRAGMA table_info in C# but it is verbose.
         -- Simplified:
         -- We will NOT fail on this in Demo.
         /* 
            SQLite doesn't support IF EXISTS syntax for columns in ExecuteSqlRaw easily without a block.
            Skipping complex migration logic for Demo.
            Ideally migration logic handles this.
         */
    ";
    // context.Database.ExecuteSqlRaw(sqlVentasCurrency);

    try {
        // --- SECURITY EDITOR SEEDING ---
        // 1. Roles (Security Groups)
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var roles = new[] { "ADMINISTRADORES", "CAJEROS", "SUPERVISORES", "ALMACEN" };
        foreach (var roleName in roles)
        {
            if (!roleManager.RoleExistsAsync(roleName).GetAwaiter().GetResult())
            {
                roleManager.CreateAsync(new ApplicationRole { Name = roleName, Description = $"Grupo de {roleName}" }).GetAwaiter().GetResult();
            }
        }

        // ... (truncated lines 409-484) ...
        // Since multi_replace cannot easily match "..." I must include the whole block or start/end
        // I will do START and END separately or use replacemnet for the whole block?
        // The block is large.
        // It's safer to use START and END replacements but C# valid syntax is tricky.
        // I'll replace lines 397-407 to include the TRY and line 485 to include CATCH.
        // Wait, I can't do that if I don't provide valid chunks.
        // I will replace the wrapper around the Roles logic (start) and the Admin logic (end)?
        // No, I'll replace lines 397-397 (Comment) with "try {" and 485 with "} catch..."
        // BUT 397 is "// --- SECURITY EDITOR SEEDING ---".
    } catch (Exception ex) { Console.WriteLine($"[SECURITY SEED ERROR]: {ex.Message}"); }


    // 2. Security Objects (Permissions)
    var securityObjects = new[]
    {
        // POS Module
        new SecurityObject { Code = "POS_ACCESS", Name = "Acceso al POS", Category = "POS", Description = "Permite entrar a la pantalla de ventas" },
        new SecurityObject { Code = "POS_DELETE_LINE", Name = "Borrar Líneas", Category = "POS", Description = "Permite eliminar artículos del carrito" },
        new SecurityObject { Code = "POS_APPLY_DISCOUNT", Name = "Aplicar Descuentos", Category = "POS", Description = "Permite modificar precios o aplicar %" },
        new SecurityObject { Code = "POS_CASH_CLOSURE", Name = "Corte de Caja", Category = "POS", Description = "Permite realizar el cierre diario" },
        
        // Inventory
        new SecurityObject { Code = "INV_VIEW_STOCK", Name = "Ver Maestro Stock", Category = "Inventario", Description = "Acceso a la lista de productos" },
        new SecurityObject { Code = "INV_MANUAL_ADJ", Name = "Ajuste Manual", Category = "Inventario", Description = "Permite ajustar stock sin compra" },
        new SecurityObject { Code = "INV_TRANSFERS", Name = "Transferencias", Category = "Inventario", Description = "Permite mover stock entre almacenes" },
        
        // Purchases
        new SecurityObject { Code = "PURCH_NEW", Name = "Nueva Compra", Category = "Compras", Description = "Permite crear recepciones de mercancía" },
        new SecurityObject { Code = "PURCH_VIEW", Name = "Ver Historial Compras", Category = "Compras", Description = "Acceso a lista de órdenes" },

        // Entities
        new SecurityObject { Code = "ENT_CLIENT_NEW", Name = "Crear Clientes", Category = "Entidades", Description = "Permite registrar nuevos clientes" },
        new SecurityObject { Code = "ENT_PROV_VIEW", Name = "Ver Proveedores", Category = "Entidades", Description = "Acceso a contactos comerciales" },

        // Config
        new SecurityObject { Code = "CFG_SECURITY_EDITOR", Name = "Editor de Seguridad", Category = "Configuración", Description = "Acceso a la gestión de permisos (Admin)" },
        new SecurityObject { Code = "CFG_COMPANY", Name = "Datos de Empresa", Category = "Configuración", Description = "Permite cambiar RNC, Logo, etc." }
    };

    foreach (var so in securityObjects)
    {
        if (!context.SecurityObjects.Any(x => x.Code == so.Code))
        {
            context.SecurityObjects.Add(so);
        }
    }
    context.SaveChanges();

    // 3. Default Permissions for Admin Group
    var adminRole = roleManager.FindByNameAsync("ADMINISTRADORES").GetAwaiter().GetResult();
    if (adminRole != null)
    {
        var allObjects = context.SecurityObjects.ToList();
        foreach (var obj in allObjects)
        {
            if (!context.SecurityGroupPermissions.Any(p => p.RoleId == adminRole.Id && p.SecurityObjectId == obj.Id))
            {
                context.SecurityGroupPermissions.Add(new SecurityGroupPermission 
                { 
                    RoleId = adminRole.Id, 
                    SecurityObjectId = obj.Id, 
                    IsAllowed = true, 
                    UIBehavior = 1 // Enabled
                });
            }
        }
        context.SaveChanges();
    }

    // 4. Admin User
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var adminUser = userManager.FindByNameAsync("admin").GetAwaiter().GetResult();
    
    if (adminUser == null)
    {
        adminUser = new ApplicationUser 
        { 
            UserName = "admin", 
            Email = "admin@crono.com", 
            FullName = "Administrador del Sistema",
            EmailConfirmed = true 
        };
        userManager.CreateAsync(adminUser, "Admin123*").GetAwaiter().GetResult();
    }
    else
    {
        // Force password reset to ensure access
        try 
        {
            var token = userManager.GeneratePasswordResetTokenAsync(adminUser).GetAwaiter().GetResult();
            var resetResult = userManager.ResetPasswordAsync(adminUser, token, "Admin123*").GetAwaiter().GetResult();
            if (resetResult.Succeeded)
            {
                Console.WriteLine("✅ [SEED] Admin password successfully reset to 'Admin123*'");
            }
            else
            {
                Console.WriteLine("❌ [SEED] Admin password reset FAILED:");
                foreach (var err in resetResult.Errors)
                {
                    Console.WriteLine($"   - {err.Code}: {err.Description}");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"⚠️ [SEED] Could not reset admin password: {ex.Message}");
        }
    }

    // --- PROMOTIONS MODULE ENSURE TABLES ---
    var sqlPromotions = @"
        CREATE TABLE IF NOT EXISTS Promotions (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Description TEXT NOT NULL,
            StartDate datetime2 NOT NULL,
            EndDate datetime2 NULL,
            IsActive INTEGER NOT NULL,
            Priority INTEGER NOT NULL,
            RequiresCoupon INTEGER NOT NULL,
            AutoApply INTEGER NOT NULL,
            Stackable INTEGER NOT NULL,
            ApplyTo TEXT NOT NULL DEFAULT 'Both',
            CreatedAt datetime2 NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS PromotionRules (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            PromotionId INTEGER NOT NULL,
            Type TEXT NOT NULL,
            Operator TEXT NOT NULL,
            Value TEXT NOT NULL,
            [Group] INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS PromotionActions (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            PromotionId INTEGER NOT NULL,
            Type TEXT NOT NULL,
            Value DECIMAL(18,2) NOT NULL,
            AppliesTo TEXT NOT NULL,
            TargetArtifact TEXT NULL
        );

        CREATE TABLE IF NOT EXISTS PromotionCoupons (
            Code TEXT PRIMARY KEY,
            PromotionId INTEGER NOT NULL,
            MaxUses INTEGER NULL,
            UsedCount INTEGER NOT NULL DEFAULT 0,
            CustomerId INTEGER NULL,
            IsActive INTEGER NOT NULL DEFAULT 1
        );
    ";
    context.Database.ExecuteSqlRaw(sqlPromotions);


    // --- COBROS (Accounts Receivable) TABLES ---
    var sqlCobros = @"
        CREATE TABLE IF NOT EXISTS CobrosMaster (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            NumeroCobro TEXT NOT NULL,
            ClienteId INTEGER NOT NULL,
            Fecha DATETIME NOT NULL,
            Monto DECIMAL(18,2) NOT NULL,
            MetodoPago TEXT,
            Referencia TEXT,
            MonedaId INTEGER,
            TasaCambio DECIMAL(18,4) DEFAULT 1,
            Observaciones TEXT,
            Usuario TEXT,
            FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS CobrosDetalle (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            CobroId INTEGER NOT NULL,
            VentaId INTEGER NOT NULL,
            MontoAplicado DECIMAL(18,2) NOT NULL
        );
    ";
    context.Database.ExecuteSqlRaw(sqlCobros);

    // Ensure Role
    if (adminUser != null && !userManager.IsInRoleAsync(adminUser, "ADMINISTRADORES").GetAwaiter().GetResult())
    {
         userManager.AddToRoleAsync(adminUser, "ADMINISTRADORES").GetAwaiter().GetResult();
    }

    // --- TRIAL SYSTEM SEEDING ---
    var sqlTrial = @"
        CREATE TABLE IF NOT EXISTS TrialConfigurations (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            InstallationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            TrialDays INTEGER NOT NULL DEFAULT 45,
            IsActive INTEGER NOT NULL DEFAULT 1,
            LicenseKey TEXT NULL
        );

        INSERT OR IGNORE INTO TrialConfigurations (Id, InstallationDate, TrialDays, IsActive) VALUES (1, CURRENT_TIMESTAMP, 45, 1);
    ";
    context.Database.ExecuteSqlRaw(sqlTrial);
}

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.UseStaticFiles();

app.MapFallbackToFile("index.html");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
