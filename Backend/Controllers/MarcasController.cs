using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MarcasController : ControllerBase
    {
        private readonly string _connectionString;

        public MarcasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            using var connection = new SqlConnection(_connectionString);
            var items = await connection.QueryAsync<Marca>("SELECT * FROM Marcas ORDER BY Nombre");
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Marca item)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                INSERT INTO Marcas (Codigo, Nombre, Descripcion, Activo)
                VALUES (@Codigo, @Nombre, @Descripcion, @Activo);
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var id = await connection.QuerySingleAsync<int>(sql, item);
            item.Id = id;
            return Ok(item);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Marca item)
        {
            item.Id = id;
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                UPDATE Marcas 
                SET Codigo = @Codigo, 
                    Nombre = @Nombre, 
                    Descripcion = @Descripcion, 
                    Activo = @Activo
                WHERE Id = @Id";
            await connection.ExecuteAsync(sql, item);
            return Ok(item);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync("DELETE FROM Marcas WHERE Id = @Id", new { Id = id });
            return Ok();
        }
    }
}
