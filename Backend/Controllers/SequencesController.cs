using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SequencesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SequencesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Sequences
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocumentSequence>>> GetSequences()
        {
            return await _context.DocumentSequences.ToListAsync();
        }

        // PUT: api/Sequences/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSequence(int id, DocumentSequence sequence)
        {
            if (id != sequence.Id)
            {
                return BadRequest();
            }

            var existing = await _context.DocumentSequences.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            existing.Prefix = sequence.Prefix;
            existing.CurrentValue = sequence.CurrentValue;
            existing.Length = sequence.Length;
            existing.LastModified = DateTime.Now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!SequenceExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        private bool SequenceExists(int id)
        {
            return _context.DocumentSequences.Any(e => e.Id == id);
        }
    }
}
