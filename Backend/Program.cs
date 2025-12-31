using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using Microsoft.AspNetCore.Identity;
using PosCrono.API.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PosCrono.API.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddControllers();

// Modern Inventory Services
builder.Services.AddTransient<IEmailService, EmailService>();

// SQLite Configuration for Demo
var connectionString = "Data Source=cronodemo.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

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
var jwtKey = "SUPER_SECRET_KEY_FOR_POS_CRONO_2025_DEVELOPMENT_ONLY";
var key = Encoding.ASCII.GetBytes(jwtKey);

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
app.UseCors("AllowReactApp");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Database Initialization and Seeding
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();

    // Create database and tables
    context.Database.EnsureCreated();

    try {
        // 1. Seed Roles
        var roles = new[] { "ADMINISTRADORES", "CAJEROS", "SUPERVISORES", "ALMACEN" };
        foreach (var roleName in roles)
        {
            if (!roleManager.RoleExistsAsync(roleName).GetAwaiter().GetResult())
            {
                roleManager.CreateAsync(new ApplicationRole { Name = roleName, Description = $"Grupo de {roleName}" }).GetAwaiter().GetResult();
            }
        }

        // 2. Seed Admin User
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
            var result = userManager.CreateAsync(adminUser, "Admin123*").GetAwaiter().GetResult();
            if (result.Succeeded)
            {
                userManager.AddToRoleAsync(adminUser, "ADMINISTRADORES").GetAwaiter().GetResult();
            }
        }

        // 3. Seed Default Client (Consumidor Final)
        if (!context.Clients.Any(c => c.Id == 1 || c.Name == "CONSUMIDOR FINAL"))
        {
            context.Clients.Add(new Client 
            { 
                Code = "CLIENT-0001", 
                Name = "CONSUMIDOR FINAL", 
                Company = "GENERAL", 
                TaxId = "000-00000-0", 
                Status = "Active",
                Balance = 0
            });
            context.SaveChanges();
        }
        
    } catch (Exception ex) {
        Console.WriteLine($"[SEED ERROR]: {ex.Message}");
    }
}

app.Run();
