using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly string _connectionString;

        public CategoriasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            using var connection = new SqlConnection(_connectionString);
            var categorias = await connection.QueryAsync<Categoria>("SELECT * FROM Categorias ORDER BY Nombre");
            return Ok(categorias);
        }

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Categoria categoria)
        {
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                INSERT INTO Categorias (Codigo, Nombre, Descripcion, Activo)
                VALUES (@Codigo, @Nombre, @Descripcion, @Activo);
                SELECT CAST(SCOPE_IDENTITY() as int)";
            
            var id = await connection.QuerySingleAsync<int>(sql, categoria);
            categoria.Id = id;
            
            return Ok(categoria);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Categoria categoria)
        {
            categoria.Id = id;
            using var connection = new SqlConnection(_connectionString);
            var sql = @"
                UPDATE Categorias 
                SET Codigo = @Codigo, 
                    Nombre = @Nombre, 
                    Descripcion = @Descripcion, 
                    Activo = @Activo
                WHERE Id = @Id";
            
            await connection.ExecuteAsync(sql, categoria);
            return Ok(categoria);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.ExecuteAsync("DELETE FROM Categorias WHERE Id = @Id", new { Id = id });
            return Ok();
        }
    }
}
