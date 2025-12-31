using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;
using System.Text.Json.Serialization;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArticuloHistorialController : ControllerBase
    {
        private readonly string _connectionString;

        public ArticuloHistorialController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/ArticuloHistorial/{articuloId}
        [HttpGet("{articuloId}")]
        public async Task<IActionResult> GetHistorial(int articuloId, [FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin, [FromQuery] int? almacenId)
        {
            Console.WriteLine($"[ArticuloHistorial] Request for Id: {articuloId}");
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    // 1. Get Article Header Info
                    var sqlHeader = @"
                        SELECT 
                            a.Id,
                            a.NumeroArticulo as Codigo,
                            a.Descripcion,
                            a.Categoria,
                            a.UnidadMedida,
                            a.StockActual as ExistenciaActual,
                            CASE WHEN a.Activo = 1 THEN 'Activo' ELSE 'Inactivo' END as Estado,
                            a.CostoUnitario,
                            a.PrecioUnitario as PrecioVenta
                        FROM ArticulosMaster a
                        WHERE a.Id = @Id";

                    var header = await connection.QuerySingleOrDefaultAsync<ArticuloHeaderDto>(sqlHeader, new { Id = articuloId });

                    if (header == null)
                        return NotFound(new { message = "Artículo no encontrado" });

                    // 2. Get Movements History
                    var sqlMovimientos = @"
                        SELECT 
                            m.Id,
                            m.FechaMovimiento,
                            m.TipoMovimiento,
                            m.Referencia,
                            m.Cantidad,
                            m.CostoUnitario as Costo,
                            m.StockNuevo as Balance,
                            m.Usuario,
                            m.NumeroDocumento,
                            m.AlmacenId,
                                CASE 
                                WHEN m.TipoMovimiento IN ('Compra', 'Entrada', 'Recepcion', 'AjusteEntrada', 'DevolucionVenta', 'Devolucion', 'TransferenciaDetalle', 'TransferenciaEntrada', 'Transferencia Entrada') OR ((m.TipoMovimiento = 'Transferencia' OR m.TipoMovimiento = 'Ajuste') AND m.Cantidad > 0) THEN m.Cantidad 
                                ELSE 0 
                            END as Entrada,
                            CASE 
                                WHEN m.TipoMovimiento IN ('Venta', 'Salida', 'AjusteSalida', 'DevolucionCompra', 'TransferenciaSalida', 'Transferencia Salida') OR ((m.TipoMovimiento = 'Transferencia' OR m.TipoMovimiento = 'Ajuste') AND m.Cantidad < 0) THEN ABS(m.Cantidad) 
                                ELSE 0 
                            END as Salida,
                            COALESCE(alm.Nombre, m.AlmacenId, 'General') as AlmacenNombre,
                            m.StockAnterior
                        FROM MovimientosInventario m
                        LEFT JOIN Almacenes alm ON (m.AlmacenId = alm.Codigo OR m.AlmacenId = CAST(alm.Id AS NVARCHAR(50)))
                        WHERE m.ArticuloId = @Id
                        AND (@FechaInicio IS NULL OR m.FechaMovimiento >= @FechaInicio)
                        AND (@FechaFin IS NULL OR m.FechaMovimiento <= @FechaFin)
                        -- Filter by AlmacenId loosely matching logic in Kardex
                        AND (@AlmacenId IS NULL 
                               OR m.AlmacenId = CAST(@AlmacenId AS NVARCHAR(50))
                               OR (@AlmacenId = 1 AND m.AlmacenId = 'Principal')
                            )
                        ORDER BY m.FechaMovimiento DESC";

                    var movimientos = (await connection.QueryAsync<HistorialMovimientoRow>(sqlMovimientos, new 
                    { 
                        Id = articuloId, 
                        FechaInicio = fechaInicio, 
                        FechaFin = fechaFin,
                        AlmacenId = almacenId
                    })).ToList();

                    // 2.1 Get Stock Distribution by Warehouse (Aggregation)
                    var sqlStockDist = @"
                        SELECT 
                            COALESCE(alm.Nombre, m.AlmacenId, 'General') as Almacen,
                            SUM(m.Cantidad) as Stock
                        FROM MovimientosInventario m
                        LEFT JOIN Almacenes alm ON (m.AlmacenId = alm.Codigo OR m.AlmacenId = CAST(alm.Id AS NVARCHAR(50)))
                        WHERE m.ArticuloId = @Id
                        GROUP BY COALESCE(alm.Nombre, m.AlmacenId, 'General')
                        HAVING SUM(m.Cantidad) != 0";
                    
                    var stockDistribucion = (await connection.QueryAsync<StockPorAlmacenDto>(sqlStockDist, new { Id = articuloId })).ToList();

                    // 3. Calculate KPIs (Aggregated from ALL time, or just selected range? 
                    // User asked for "Entradas Totales (histórico)", implying all time.
                    // But if filters are applied, maybe it should reflect filtering? 
                    // Let's do filtered KPIs for now as it makes more sense in a dashboard context, 
                    // except for current Stock which is always 'now').
                    
                    var totalEntradas = movimientos.Sum(m => m.Entrada);
                    var totalSalidas = movimientos.Sum(m => m.Salida);
                    
                    // Specific Totals requested by user
                    var totalCompras = movimientos
                        .Where(m => string.Equals(m.TipoMovimiento, "Compra", StringComparison.OrdinalIgnoreCase) || 
                                    string.Equals(m.TipoMovimiento, "Recepcion", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(m.TipoMovimiento, "Entrada", StringComparison.OrdinalIgnoreCase))
                        .Sum(m => m.Entrada);

                    var totalVentas = movimientos.Where(m => string.Equals(m.TipoMovimiento, "Venta", StringComparison.OrdinalIgnoreCase)).Sum(m => m.Salida);

                    var balanceNeto = totalEntradas - totalSalidas; // On the period

                    // Calculate Entradas por Recepción KPI
                    var totalEntradasRecepcion = movimientos
                        .Where(m => string.Equals(m.TipoMovimiento, "Recepcion", StringComparison.OrdinalIgnoreCase))
                        .Sum(m => m.Entrada);

                    var kpis = new ArticuloKpiDto
                    {
                        ExistenciaActual = header.ExistenciaActual, // Always current
                        EntradasTotales = totalEntradas,
                        SalidasTotales = totalSalidas,
                        TotalCompras = totalCompras,
                        TotalVentas = totalVentas,
                        EntradasRecepcion = totalEntradasRecepcion,
                        BalanceNeto = balanceNeto, 
                        UltimoMovimiento = movimientos.FirstOrDefault()?.FechaMovimiento
                    };

                    return Ok(new ArticuloHistorialDto
                    {
                        Encabezado = header,
                        Kpis = kpis,
                        Movimientos = movimientos,
                        StockDistribucion = stockDistribucion
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener historial", error = ex.Message });
            }
        }
    }

    public class ArticuloHistorialDto
    {
        public ArticuloHeaderDto Encabezado { get; set; }
        public ArticuloKpiDto Kpis { get; set; }
        public List<HistorialMovimientoRow> Movimientos { get; set; }
        public List<StockPorAlmacenDto> StockDistribucion { get; set; }
    }

    public class StockPorAlmacenDto
    {
        public string Almacen { get; set; }
        public decimal Stock { get; set; }
    }

    public class ArticuloHeaderDto
    {
        public int Id { get; set; }
        public string Codigo { get; set; }
        public string Descripcion { get; set; }
        public string Categoria { get; set; }
        public string UnidadMedida { get; set; }
        public decimal ExistenciaActual { get; set; }
        public string Estado { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal PrecioVenta { get; set; }
    }

    public class ArticuloKpiDto
    {
        public decimal ExistenciaActual { get; set; }
        public decimal EntradasTotales { get; set; }
        public decimal SalidasTotales { get; set; }
        public decimal TotalCompras { get; set; }
        public decimal TotalVentas { get; set; }
        public decimal EntradasRecepcion { get; set; } // Sum of Entrada for Recepcion movements
        public decimal BalanceNeto { get; set; }
        public DateTime? UltimoMovimiento { get; set; }
    }

    public class HistorialMovimientoRow
    {
        public int Id { get; set; }
        public DateTime FechaMovimiento { get; set; }
        public string TipoMovimiento { get; set; }
        public string Referencia { get; set; }
        public decimal Cantidad { get; set; } // Raw signed quantity
        public decimal Entrada { get; set; }
        public decimal Salida { get; set; }
        public decimal Costo { get; set; } // Unit cost of movement
        public string Usuario { get; set; }
        public string AlmacenId { get; set; }
        public string Comentario { get; set; }
        public string AlmacenNombre { get; set; }
        public string NumeroDocumento { get; set; } // Added
        public decimal? Balance { get; set; } // Mapped from StockNuevo alias
        public decimal? StockAnterior { get; set; }
    }
}
