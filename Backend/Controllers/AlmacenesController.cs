using PosCrono.API.Models;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AlmacenesController : ControllerBase
    {
        private readonly string _connectionString;

        public AlmacenesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            using var connection = new SqlConnection(_connectionString);
            var almacenes = await connection.QueryAsync<Almacen>("SELECT * FROM Almacenes ORDER BY Nombre");
            return Ok(almacenes);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Almacen almacen)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                INSERT INTO Almacenes (Codigo, Nombre, Direccion, Ciudad, Activo)
                VALUES (@Codigo, @Nombre, @Direccion, @Ciudad, 1);
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var id = await connection.QuerySingleAsync<int>(sql, almacen);
            almacen.Id = id;
            almacen.Activo = true;
            return Ok(almacen);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Almacen almacen)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                UPDATE Almacenes 
                SET Codigo = @Codigo, 
                    Nombre = @Nombre,
                    Direccion = @Direccion,
                    Ciudad = @Ciudad,
                    Activo = @Activo
                WHERE Id = @Id";
            
            almacen.Id = id;
            await connection.ExecuteAsync(sql, almacen);
            return Ok(almacen);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync("DELETE FROM Almacenes WHERE Id = @Id", new { Id = id });
            return Ok();
        }
    }
}
