using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class KardexController : ControllerBase
    {
        private readonly string _connectionString;

        public KardexController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/Kardex
        [HttpGet]
        public async Task<IActionResult> GetMovimientos([FromQuery] int? almacenId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    string almacenCodigo = null;
                    if (almacenId.HasValue)
                    {
                        almacenCodigo = await connection.QuerySingleOrDefaultAsync<string>(
                            "SELECT Codigo FROM Almacenes WHERE Id = @Id", new { Id = almacenId });
                    }

                    // Update query to handle mixed types in AlmacenId column (Int ID, Code, or 'Principal')
                    var sql = @"
                        SELECT 
                            m.Id,
                            m.FechaMovimiento,
                            m.TipoMovimiento,
                            m.Referencia as Documento,
                            a.Descripcion as Producto,
                            m.Cantidad,
                            m.CostoUnitario,
                            (m.Cantidad * m.CostoUnitario) as Total,
                            m.Usuario,
                            m.StockAnterior,
                            m.StockNuevo,
                            m.UnidadMedida,
                            m.CantidadOriginal,
                            m.UnidadOriginal
                        FROM MovimientosInventario m
                        INNER JOIN ArticulosMaster a ON m.ArticuloId = a.Id
                        WHERE (@AlmacenId IS NULL 
                               OR m.AlmacenId = CAST(@AlmacenId AS NVARCHAR(50)) -- Matches new '1'
                               OR m.AlmacenId = @AlmacenCodigo -- Matches 'ALM-001'
                               OR (@AlmacenId = 1 AND m.AlmacenId = 'Principal') -- Matches legacy 'Principal'
                              )
                        ORDER BY m.FechaMovimiento DESC";
                    
                    var movimientos = await connection.QueryAsync<KardexEntryDto>(sql, new { AlmacenId = almacenId, AlmacenCodigo = almacenCodigo });
                    return Ok(movimientos);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener kardex", error = ex.Message });
            }
        }
    }

    public class KardexEntryDto
    {
        public int Id { get; set; }
        public DateTime FechaMovimiento { get; set; }
        public string TipoMovimiento { get; set; }
        public string Documento { get; set; }
        public string Producto { get; set; }
        public decimal Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal Total { get; set; }
        public string Usuario { get; set; }
        public decimal? StockAnterior { get; set; }
        public decimal? StockNuevo { get; set; }
        public string UnidadMedida { get; set; }
        public decimal? CantidadOriginal { get; set; }
        public string? UnidadOriginal { get; set; }
    }
}
