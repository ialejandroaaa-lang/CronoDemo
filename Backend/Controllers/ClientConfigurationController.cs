using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/ClientConfiguration
        [HttpGet]
        public async Task<ActionResult<ClientConfiguration>> GetConfiguration()
        {
            // Singleton pattern: always return the first/only config, or create default
            var config = await _context.ClientConfigurations.FirstOrDefaultAsync();

            if (config == null)
            {
                config = new ClientConfiguration();
                _context.ClientConfigurations.Add(config);
                await _context.SaveChangesAsync();
            }

            return config;
        }

        // POST: api/ClientConfiguration
        [HttpPost]

        public async Task<ActionResult<ClientConfiguration>> UpdateConfiguration([FromBody] ClientConfiguration config)
        {
             if (config == null) return BadRequest();

             var existing = await _context.ClientConfigurations.FirstOrDefaultAsync();
             if (existing == null)
             {
                 _context.ClientConfigurations.Add(config);
                 await _context.SaveChangesAsync();
                 return Ok(config);
             }
             
             existing.UseAutoSequence = config.UseAutoSequence;
             existing.UseInitials = config.UseInitials;
             existing.Initials = config.Initials;
             existing.SequenceLength = config.SequenceLength;
             existing.CurrentValue = config.CurrentValue;
             existing.Separator = config.Separator;
             existing.NameCase = config.NameCase;
             existing.AllowNegativeStock = config.AllowNegativeStock;
             
             await _context.SaveChangesAsync();
             return Ok(existing);
        }

        // GET: api/ClientConfiguration/NextCode
        [HttpGet("NextCode")]
        public async Task<ActionResult<string>> GetNextCode()
        {
            var config = await _context.ClientConfigurations.FirstOrDefaultAsync();
            if (config == null) return "0001"; // Default fallback

            return Ok(config.GenerateNextCode());
        }
    }
}
