using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaymentConfiguration>> GetConfiguration()
        {
            var config = await _context.PaymentConfigurations.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new PaymentConfiguration();
                _context.PaymentConfigurations.Add(config);
                await _context.SaveChangesAsync();
            }
            return config;
        }

        [HttpPost]
        public async Task<ActionResult<PaymentConfiguration>> UpdateConfiguration([FromBody] PaymentConfiguration config)
        {
            var existing = await _context.PaymentConfigurations.FirstOrDefaultAsync();
            if (existing == null)
            {
                _context.PaymentConfigurations.Add(config);
            }
            else
            {
                existing.UseAutoSequence = config.UseAutoSequence;
                existing.Prefix = config.Prefix;
                existing.SequenceLength = config.SequenceLength;
                existing.CurrentValue = config.CurrentValue;
                existing.Separator = config.Separator;
            }
            await _context.SaveChangesAsync();
            return Ok(existing ?? config);
        }

        [HttpGet("NextCode")]
        public async Task<ActionResult<string>> GetNextCode()
        {
            var config = await _context.PaymentConfigurations.FirstOrDefaultAsync();
            if (config == null || !config.UseAutoSequence)
            {
                return Ok("");
            }
            return Ok(config.GenerateNextCode());
        }

        [HttpPost("Increment")]
        public async Task<IActionResult> IncrementSequence()
        {
            var config = await _context.PaymentConfigurations.FirstOrDefaultAsync();
            if (config != null)
            {
                config.CurrentValue++;
                await _context.SaveChangesAsync();
            }
            return Ok();
        }
    }
}
