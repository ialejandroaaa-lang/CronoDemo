using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GruposProductoController : ControllerBase
    {
        private readonly string _connectionString;

        public GruposProductoController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/GruposProducto
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var grupos = new List<object>();
                
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        SELECT Id, Codigo, Nombre, Descripcion, Activo
                        FROM GruposProducto
                        ORDER BY Nombre
                    ", connection);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            grupos.Add(new
                            {
                                id = Convert.ToInt32(reader["Id"]),
                                codigo = reader["Codigo"].ToString(),
                                nombre = reader["Nombre"].ToString(),
                                descripcion = reader["Descripcion"]?.ToString(),
                                activo = Convert.ToBoolean(reader["Activo"])
                            });
                        }
                    }
                }

                return Ok(grupos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving product groups", error = ex.Message });
            }
        }

        // POST: api/GruposProducto
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] GrupoProductoDto grupo)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        INSERT INTO GruposProducto (Codigo, Nombre, Descripcion, Activo)
                        VALUES (@Codigo, @Nombre, @Descripcion, @Activo);
                        SELECT CAST(SCOPE_IDENTITY() as int);
                    ", connection);

                    command.Parameters.AddWithValue("@Codigo", grupo.Codigo);
                    command.Parameters.AddWithValue("@Nombre", grupo.Nombre);
                    command.Parameters.AddWithValue("@Descripcion", grupo.Descripcion ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@Activo", grupo.Activo);

                    var newId = (int)await command.ExecuteScalarAsync();
                    
                    return Ok(new { id = newId, message = "Product group created successfully" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error creating product group", error = ex.Message });
            }
        }

        // PUT: api/GruposProducto/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] GrupoProductoDto grupo)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        UPDATE GruposProducto
                        SET Codigo = @Codigo,
                            Nombre = @Nombre,
                            Descripcion = @Descripcion,
                            Activo = @Activo,
                            FechaModificacion = GETDATE()
                        WHERE Id = @Id
                    ", connection);

                    command.Parameters.AddWithValue("@Id", id);
                    command.Parameters.AddWithValue("@Codigo", grupo.Codigo);
                    command.Parameters.AddWithValue("@Nombre", grupo.Nombre);
                    command.Parameters.AddWithValue("@Descripcion", grupo.Descripcion ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@Activo", grupo.Activo);

                    await command.ExecuteNonQueryAsync();
                    
                    return Ok(new { message = "Product group updated successfully" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error updating product group", error = ex.Message });
            }
        }

        // DELETE: api/GruposProducto/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        DELETE FROM GruposProducto WHERE Id = @Id
                    ", connection);

                    command.Parameters.AddWithValue("@Id", id);
                    await command.ExecuteNonQueryAsync();
                    
                    return Ok(new { message = "Product group deleted successfully" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting product group", error = ex.Message });
            }
        }
    }

    public class GrupoProductoDto
    {
        public string Codigo { get; set; } = "";
        public string Nombre { get; set; } = "";
        public string? Descripcion { get; set; }
        public bool Activo { get; set; } = true;
    }
}
