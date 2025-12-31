using PosCrono.API.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GruposImpuestosController : ControllerBase
    {
        private readonly string _connectionString;

        public GruposImpuestosController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            using var connection = new SqlConnection(_connectionString);
            var grupos = await connection.QueryAsync<GrupoImpuesto>("SELECT * FROM GruposImpuestos ORDER BY Nombre");
            return Ok(grupos);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] GrupoImpuesto grupo)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                INSERT INTO GruposImpuestos (Codigo, Nombre, Descripcion, Tasa, Activo)
                VALUES (@Codigo, @Nombre, @Descripcion, @Tasa, 1);
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var id = await connection.QuerySingleAsync<int>(sql, grupo);
            grupo.Id = id;
            grupo.Activo = true;
            return Ok(grupo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] GrupoImpuesto grupo)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                UPDATE GruposImpuestos 
                SET Codigo = @Codigo, 
                    Nombre = @Nombre,
                    Descripcion = @Descripcion,
                    Tasa = @Tasa,
                    Activo = @Activo
                WHERE Id = @Id";
            
            grupo.Id = id;
            await connection.ExecuteAsync(sql, grupo);
            return Ok(grupo);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync("DELETE FROM GruposImpuestos WHERE Id = @Id", new { Id = id });
            return Ok();
        }
    }
}
