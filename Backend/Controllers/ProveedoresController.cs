using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProveedoresController : ControllerBase
    {
        private readonly string _connectionString;

        public ProveedoresController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/Proveedores
        [HttpGet]
        public async Task<IActionResult> GetAllProveedores()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            p.*, 
                            ISNULL((SELECT SUM(Saldo) FROM ComprasMaster c WHERE c.ProveedorId = p.Id AND c.Saldo > 0 AND c.Estado <> 'Anulado' AND c.TipoDocumento = 'Factura'), 0) as DeudaTotal
                        FROM ProveedoresMaster p 
                        WHERE p.Activo = 1 
                        ORDER BY p.RazonSocial";
                    var proveedores = await connection.QueryAsync<ProveedorDto>(sql);
                    return Ok(proveedores);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener proveedores", error = ex.Message });
            }
        }

        // GET: api/Proveedores/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProveedor(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = "SELECT * FROM ProveedoresMaster WHERE Id = @Id";
                    var proveedor = await connection.QuerySingleOrDefaultAsync<ProveedorDto>(sql, new { Id = id });

                    if (proveedor == null)
                        return NotFound();

                    return Ok(proveedor);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener proveedor", error = ex.Message });
            }
        }

        // POST: api/Proveedores
        [HttpPost]
        public async Task<IActionResult> CreateProveedor([FromBody] ProveedorDto proveedor)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        INSERT INTO ProveedoresMaster (
                            CodigoProveedor, RazonSocial, NumeroDocumento, 
                            Direccion, Telefono, Correo, Contacto, TipoComprobante,
                            Activo, FechaCreacion, UsuarioCreacion
                        ) VALUES (
                            @CodigoProveedor, @RazonSocial, @NumeroDocumento, 
                            @Direccion, @Telefono, @Correo, @Contacto, @TipoComprobante,
                            1, GETDATE(), 'Sistema'
                        );
                        SELECT CAST(SCOPE_IDENTITY() as int);";

                    var id = await connection.QuerySingleAsync<int>(sql, proveedor);
                    return Ok(new { message = "Proveedor creado exitosamente", id = id });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear proveedor", error = ex.Message });
            }
        }

        // PUT: api/Proveedores/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProveedor(int id, [FromBody] ProveedorDto proveedor)
        {
            if (id != proveedor.Id) return BadRequest();

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        UPDATE ProveedoresMaster 
                        SET 
                            CodigoProveedor = @CodigoProveedor,
                            RazonSocial = @RazonSocial,
                            NumeroDocumento = @NumeroDocumento,
                            Direccion = @Direccion,
                            Telefono = @Telefono,
                            Correo = @Correo,
                            Contacto = @Contacto,
                            TipoComprobante = @TipoComprobante
                        WHERE Id = @Id";

                    await connection.ExecuteAsync(sql, proveedor);
                    return NoContent();
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar proveedor", error = ex.Message });
            }
        }

        // DELETE: api/Proveedores/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProveedor(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = "UPDATE ProveedoresMaster SET Activo = 0 WHERE Id = @Id";
                    await connection.ExecuteAsync(sql, new { Id = id });
                    return Ok(new { message = "Proveedor eliminado exitosamente" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar proveedor", error = ex.Message });
            }
        }
    }

    public class ProveedorDto
    {
        public int Id { get; set; }
        public string CodigoProveedor { get; set; }
        public string RazonSocial { get; set; }
        public string? NumeroDocumento { get; set; }
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? Contacto { get; set; }
        public string? TipoComprobante { get; set; } // [NEW] Type of NCF
        public bool Activo { get; set; }
        public decimal DeudaTotal { get; set; }
    }
}
