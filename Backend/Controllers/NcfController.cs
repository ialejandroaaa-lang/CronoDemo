using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NcfController : ControllerBase
    {
        private readonly string _connectionString;

        public NcfController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = "SELECT * FROM NCF_Secuencias ORDER BY TipoNCF";
                var items = await connection.QueryAsync<NcfSecuencia>(sql);
                return Ok(items);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener NCFs", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] NcfSecuencia ncf)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = @"UPDATE NCF_Secuencias 
                           SET Desde = @Desde, 
                               Hasta = @Hasta, 
                               Actual = @Actual, 
                               Activo = @Activo,
                               Prefijo = @Prefijo,
                               FechaVencimiento = @FechaVencimiento
                           WHERE Id = @Id";
                
                ncf.Id = id;
                var rows = await connection.ExecuteAsync(sql, ncf);
                
                if (rows == 0) return NotFound();
                
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar NCF", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NcfSecuencia ncf)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = @"INSERT INTO NCF_Secuencias (TipoNCF, Nombre, Prefijo, Desde, Hasta, Actual, Activo, FechaVencimiento)
                           VALUES (@TipoNCF, @Nombre, @Prefijo, @Desde, @Hasta, @Actual, @Activo, @FechaVencimiento);
                           SELECT CAST(SCOPE_IDENTITY() as int)";
                
                var id = await connection.QuerySingleAsync<int>(sql, ncf);
                ncf.Id = id;
                return CreatedAtAction(nameof(GetAll), new { id }, ncf);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear NCF", error = ex.Message });
            }
        }
    }
}
