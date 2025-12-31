using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProveedorConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProveedorConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<ProveedorConfiguration>> GetConfiguration()
        {
            var config = await _context.ProveedorConfigurations.FirstOrDefaultAsync();

            if (config == null)
            {
                // Return default if not exists (though DB script inserts one)
                config = new ProveedorConfiguration
                {
                    UseAutoSequence = true,
                    UseInitials = true,
                    Initials = "PROV",
                    SequenceLength = 4,
                    CurrentValue = 1,
                    Separator = "-",
                    HabilitarFacturas = true,
                    HabilitarPagoRecurrente = true,
                    HabilitarFrecuenciaMensual = true
                };
            }

            return config;
        }

        [HttpPost]
        public async Task<ActionResult<ProveedorConfiguration>> UpdateConfiguration([FromBody] ProveedorConfiguration config)
        {
            if (config == null) return BadRequest();

            var existing = await _context.ProveedorConfigurations.FirstOrDefaultAsync();
            if (existing == null)
            {
                _context.ProveedorConfigurations.Add(config);
            }
            else
            {
                // Update properties
                existing.UseAutoSequence = config.UseAutoSequence;
                existing.UseInitials = config.UseInitials;
                existing.Initials = config.Initials;
                existing.SequenceLength = config.SequenceLength;
                existing.CurrentValue = config.CurrentValue;
                existing.Separator = config.Separator;

                existing.HabilitarFacturas = config.HabilitarFacturas;
                existing.HabilitarPagoRecurrente = config.HabilitarPagoRecurrente;
                existing.HabilitarFrecuenciaSemanal = config.HabilitarFrecuenciaSemanal;
                existing.HabilitarFrecuenciaQuincenal = config.HabilitarFrecuenciaQuincenal;
                existing.HabilitarFrecuenciaMensual = config.HabilitarFrecuenciaMensual;
                existing.HabilitarFechasEspecificas = config.HabilitarFechasEspecificas;
                
                existing.LastModified = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpGet("NextCode")]
        public async Task<ActionResult<string>> GetNextCode()
        {
            var config = await _context.ProveedorConfigurations.FirstOrDefaultAsync();
            if (config == null || !config.UseAutoSequence) return Ok("");

            return Ok(config.GenerateNextCode());
        }

        [HttpPost("Increment")]
        public async Task<IActionResult> IncrementSequence()
        {
            var config = await _context.ProveedorConfigurations.FirstOrDefaultAsync();
            if (config != null)
            {
                config.CurrentValue++;
                await _context.SaveChangesAsync();
            }
            return Ok();
        }
    }
}
