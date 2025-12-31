using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AjusteConfigurationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AjusteConfigurationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<AjusteConfiguration>> Get()
        {
            var config = await _context.AjusteConfigurations.FirstOrDefaultAsync();
            if (config == null)
            {
                config = new AjusteConfiguration { DefaultPlanId = "" };
                _context.AjusteConfigurations.Add(config);
                await _context.SaveChangesAsync();
            }
            return config;
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] AjusteConfiguration config)
        {
            var existing = await _context.AjusteConfigurations.FirstOrDefaultAsync();
            if (existing == null)
            {
                 _context.AjusteConfigurations.Add(config);
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
