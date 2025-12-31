using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CompanyConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public CompanyConfigurationController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet]
        public async Task<ActionResult<CompanyConfiguration>> GetConfiguration()
        {
            var config = await _context.CompanyConfigurations.FirstOrDefaultAsync();
            if (config == null)
            {
                try
                {
                    config = new CompanyConfiguration
                    {
                        NombreEmpresa = "Mi Empresa S.R.L.",
                        RNC = "",
                        Direccion = "",
                        Telefono = "",
                        Correo = "",
                        SitioWeb = "",
                        LogoPath = "",
                        ImpuestoDefault = 18m,
                        MonedaPrincipal = "DOP"
                    };
                    _context.CompanyConfigurations.Add(config);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Config] Error: {ex.Message}");
                    return StatusCode(500, "Error interno al inicializar la configuración.");
                }
            }
            return config;
        }

        // POST: api/CompanyConfiguration
        [HttpPost]
        public async Task<ActionResult<CompanyConfiguration>> UpdateConfiguration([FromBody] CompanyConfiguration config)
        {
             if (config == null) return BadRequest();

             var existing = await _context.CompanyConfigurations.FirstOrDefaultAsync();
             if (existing == null)
             {
                 _context.CompanyConfigurations.Add(config);
             }
             else
             {
                 existing.NombreEmpresa = config.NombreEmpresa;
                 existing.RNC = config.RNC;
                 existing.Direccion = config.Direccion;
                 existing.Telefono = config.Telefono;
                 existing.Correo = config.Correo;
                 existing.SitioWeb = config.SitioWeb;
                 existing.LogoPath = config.LogoPath;
                 existing.ImpuestoDefault = config.ImpuestoDefault;
                 existing.MonedaPrincipal = config.MonedaPrincipal;
                 existing.DefaultClientId = config.DefaultClientId;
             }
             
             await _context.SaveChangesAsync();
             return Ok(existing ?? config);
        }

        [HttpPost("upload-logo")]
        public async Task<IActionResult> UploadLogo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads");
                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = Guid.NewGuid().ToString() + "_" + file.FileName;
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                return Ok(new { path = $"/uploads/{uniqueFileName}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}
