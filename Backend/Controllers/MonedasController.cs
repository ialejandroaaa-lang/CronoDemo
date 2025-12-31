using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MonedasController : ControllerBase
    {
        private readonly string _connectionString;

        public MonedasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public async Task<IActionResult> GetMonedas()
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = "SELECT * FROM Monedas WHERE Activo = 1";
            var monedas = await connection.QueryAsync<Moneda>(sql);
            return Ok(monedas);
        }

        [HttpGet("tasas")]
        public async Task<IActionResult> GetTasas([FromQuery] int monedaId, [FromQuery] DateTime? fecha = null)
        {
            using var connection = new SqlConnection(_connectionString);
            var targetDate = fecha ?? DateTime.Now;
            
            // Logic: Find the rate where Date is between Start and End (or Start and NULL)
            // Use TOP 1 ... ORDER BY FechaInicio DESC to get the most recent applicable one if ranges overlap or are open
            var sql = @"
                SELECT TOP 1 * 
                FROM TasasCambio 
                WHERE MonedaId = @MonedaId 
                  AND FechaInicio <= @Fecha 
                  AND (FechaFin IS NULL OR FechaFin >= @Fecha)
                ORDER BY FechaInicio DESC";

            var tasa = await connection.QuerySingleOrDefaultAsync<TasaCambio>(sql, new { MonedaId = monedaId, Fecha = targetDate });
            
            if (tasa == null)
            {
                // Return default 1.0 if not found? Or 404? 
                // Better to return 1 if it matches Functional, but usually we ask for Foreign.
                // Let's return 0 or 404.
                return NotFound(new { message = "No rate found for this date" });
            }

            return Ok(tasa);
        }

        [HttpPost("tasas")]
        public async Task<IActionResult> CreateTasa([FromBody] TasaCambio tasa)
        {
            using var connection = new SqlConnection(_connectionString);
            // Verify if range overlaps? For now, simple insert.
            var sql = @"
                INSERT INTO TasasCambio (MonedaId, Tasa, FechaInicio, FechaFin)
                VALUES (@MonedaId, @Tasa, @FechaInicio, @FechaFin);
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var id = await connection.QuerySingleAsync<int>(sql, tasa);
            tasa.Id = id;
            return Ok(tasa);
        }

        [HttpGet("{id}/historial")]
        public async Task<IActionResult> GetHistorial(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = "SELECT * FROM TasasCambio WHERE MonedaId = @Id ORDER BY FechaInicio DESC";
            var historial = await connection.QueryAsync<TasaCambio>(sql, new { Id = id });
            return Ok(historial);
        }

        [HttpPut("tasas/{id}")]
        public async Task<IActionResult> UpdateTasa(int id, [FromBody] TasaCambio tasa)
        {
            if (id != tasa.Id) return BadRequest();
            using var connection = new SqlConnection(_connectionString);
            var sql = "UPDATE TasasCambio SET Tasa = @Tasa, FechaInicio = @FechaInicio, FechaFin = @FechaFin WHERE Id = @Id";
            await connection.ExecuteAsync(sql, tasa);
            return NoContent();
        }

        [HttpDelete("tasas/{id}")]
        public async Task<IActionResult> DeleteTasa(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = "DELETE FROM TasasCambio WHERE Id = @Id";
            await connection.ExecuteAsync(sql, new { Id = id });
            return Ok(new { message = "Tasa eliminada" });
        }
    }

    public class Moneda
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Nombre { get; set; }
        public string Simbolo { get; set; }
        public bool EsFuncional { get; set; }
        public bool Activo { get; set; }
    }

    public class TasaCambio
    {
        public int Id { get; set; }
        public int MonedaId { get; set; }
        public decimal Tasa { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime? FechaFin { get; set; }
    }
}
