using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RecibosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecibosController(AppDbContext context)
        {
            _context = context;
        }

        // --- Configuration Endpoints ---

        [HttpGet("config")]
        public async Task<ActionResult<ReciboConfiguration>> GetConfig()
        {
            var config = await _context.ReciboConfigurations.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new ReciboConfiguration();
                _context.ReciboConfigurations.Add(config);
                await _context.SaveChangesAsync();
            }
            return config;
        }

        [HttpPost("config")]
        public async Task<IActionResult> UpdateConfig([FromBody] ReciboConfiguration config)
        {
            var existing = await _context.ReciboConfigurations.FirstOrDefaultAsync();
            if (existing == null)
            {
                _context.ReciboConfigurations.Add(config);
            }
            else
            {
                existing.Prefijo = config.Prefijo;
                existing.SecuenciaActual = config.SecuenciaActual; // Careful allowing this
                existing.Longitud = config.Longitud;
                existing.UltimaFechaModificacion = DateTime.Now;
            }
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        // --- Receipt Endpoints ---

        [HttpGet("venta/{ventaId}")]
        public async Task<ActionResult<IEnumerable<RecibosMaster>>> GetByVenta(int ventaId)
        {
            return await _context.RecibosMaster
                .Where(r => r.VentaId == ventaId)
                .OrderByDescending(r => r.Fecha)
                .ToListAsync();
        }
    }
}
