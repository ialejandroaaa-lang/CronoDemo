using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NivelesPrecioController : ControllerBase
    {
        private readonly string _connectionString;

        public NivelesPrecioController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            using var connection = new SqlConnection(_connectionString);
            var niveles = await connection.QueryAsync<NivelPrecio>("SELECT * FROM NivelesPrecio ORDER BY Nombre");
            return Ok(niveles);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] NivelPrecio nivel)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                INSERT INTO NivelesPrecio (Nombre, Descripcion, Activo)
                VALUES (@Nombre, @Descripcion, @Activo);
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var id = await connection.QuerySingleAsync<int>(sql, nivel);
            nivel.Id = id;
            
            return Ok(nivel);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] NivelPrecio nivel)
        {
            if (id != nivel.Id && nivel.Id != 0) return BadRequest();
            nivel.Id = id;

            using var connection = new SqlConnection(_connectionString);
            var sql = @"UPDATE NivelesPrecio SET Nombre = @Nombre, Descripcion = @Descripcion, Activo = @Activo WHERE Id = @Id";
            await connection.ExecuteAsync(sql, nivel);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = "UPDATE NivelesPrecio SET Activo = 0 WHERE Id = @Id";
            await connection.ExecuteAsync(sql, new { Id = id });
            return NoContent();
        }
    }
}
