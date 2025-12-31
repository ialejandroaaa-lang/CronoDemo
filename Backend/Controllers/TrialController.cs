using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TrialController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TrialController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var config = await _context.TrialConfigurations.FirstOrDefaultAsync();
            if (config == null) return NotFound();

            var daysElapsed = (DateTime.Now - config.InstallationDate).Days;
            var daysRemaining = config.TrialDays - daysElapsed;

            return Ok(new
            {
                isExpired = daysRemaining < 0,
                daysRemaining = Math.Max(0, daysRemaining),
                installationDate = config.InstallationDate,
                trialDays = config.TrialDays,
                isActive = config.IsActive
            });
        }
        [HttpPost("activate")]
        public async Task<IActionResult> Activate([FromBody] LicenseRequest request)
        {
            var licenseService = new Services.LicenseService();
            if (licenseService.ValidateTrialKey(request.Key, out int daysGranted))
            {
                var config = await _context.TrialConfigurations.FirstOrDefaultAsync();
                if (config == null)
                {
                    config = new TrialConfiguration { InstallationDate = DateTime.Now };
                    _context.TrialConfigurations.Add(config);
                }

                // Reset installation date to "now" to give more days
                config.InstallationDate = DateTime.Now;
                config.TrialDays = daysGranted;
                config.IsActive = true;
                
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Licencia activada con éxito. {daysGranted} días adicionales concedidos." });
            }

            return BadRequest(new { message = "Clave de licencia inválida." });
        }
    }

    public class LicenseRequest { public string Key { get; set; } }
}
