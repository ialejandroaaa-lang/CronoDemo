using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TransferenciaConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransferenciaConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<TransferenciaConfiguration>> Get()
        {
            var config = await _context.TransferenciaConfigurations.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new TransferenciaConfiguration { DefaultPlanId = "" };
                _context.TransferenciaConfigurations.Add(config);
                await _context.SaveChangesAsync();
            }
            return config;
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] TransferenciaConfiguration config)
        {
            var existing = await _context.TransferenciaConfigurations.FirstOrDefaultAsync();
            if (existing == null)
            {
                 _context.TransferenciaConfigurations.Add(config);
            }
            else
            {
                existing.DefaultPlanId = config.DefaultPlanId;
                existing.DefaultUnit = config.DefaultUnit;
            }
            
            await _context.SaveChangesAsync();
            return Ok(existing ?? config);
        }
    }
}
