using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PromocionesController : ControllerBase
    {
        private readonly string _connectionString;

        public PromocionesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("Validate/{code}")]
        public async Task<IActionResult> Validate(string code)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "SELECT * FROM Promociones WHERE Codigo = @Code AND Activo = 1";
            var promo = await db.QueryFirstOrDefaultAsync<PromocionDto>(sql, new { Code = code });

            if (promo == null)
            {
                return NotFound(new { message = "Código de promoción no válido o expirado." });
            }

            // Check dates if set
            if (promo.FechaInicio.HasValue && DateTime.Now < promo.FechaInicio.Value)
                return BadRequest(new { message = "Esta promoción aún no ha comenzado." });
            
            if (promo.FechaFin.HasValue && DateTime.Now > promo.FechaFin.Value)
                return BadRequest(new { message = "Esta promoción ha expirado." });

            return Ok(promo);
        }
    }

    public class PromocionDto
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Tipo { get; set; } // 'PERCENT', 'AMOUNT'
        public decimal Valor { get; set; }
        public decimal MinCompra { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
        public bool Activo { get; set; }
    }
}
