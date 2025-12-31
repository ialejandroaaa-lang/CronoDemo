using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly string _connectionString;

        public DashboardController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("Summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                using (var db = new SqlConnection(_connectionString))
                {
                    Console.WriteLine("[Dashboard] Fetching Real Summary...");
                    
                    // 1. Sales Today (DOP)
                    var salesSql = @"
                        SELECT ISNULL(SUM(Total), 0) 
                        FROM VentasMaster 
                        WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE) AND Estado <> 'Anulado'";
                    var salesToday = await db.ExecuteScalarAsync<decimal>(salesSql);

                    // 2. Purchases Today (Normalized to DOP)
                    var purchasesSql = @"
                        SELECT ISNULL(SUM(Total * ISNULL(TasaCambio, 1)), 0) 
                        FROM ComprasMaster 
                        WHERE CAST(FechaCompra AS DATE) = CAST(GETDATE() AS DATE) 
                        AND Estado <> 'Anulado' 
                        AND TipoDocumento IN ('Factura', 'Facturation')"; 
                    var purchasesToday = await db.ExecuteScalarAsync<decimal>(purchasesSql);

                    // 3. CXP Pending (Debt)
                    var cxpSql = "SELECT ISNULL(SUM(Saldo * ISNULL(TasaCambio, 1)), 0) FROM ComprasMaster WHERE Saldo > 0 AND Estado <> 'Anulado'";
                    var cxpPending = await db.ExecuteScalarAsync<decimal>(cxpSql);

                    // 4. Low Stock count (Using StockSeguridad)
                    var stockSql = "SELECT COUNT(*) FROM ArticulosMaster WHERE StockActual <= ISNULL(StockSeguridad, 0)";
                    var lowStockCount = await db.ExecuteScalarAsync<int>(stockSql);

                    // 5. Recent Sales
                    var recentSalesSql = @"
                        SELECT TOP 5 v.NumeroFactura, c.Name as Cliente, v.Fecha, v.Total 
                        FROM VentasMaster v
                        LEFT JOIN Clients c ON v.ClienteId = c.Id
                        WHERE CAST(v.Fecha AS DATE) = CAST(GETDATE() AS DATE)
                        AND v.Estado <> 'Anulado'
                        ORDER BY v.Fecha DESC";
                    var recentSales = await db.QueryAsync(recentSalesSql);

                    return Ok(new
                    {
                        salesToday,
                        purchasesToday,
                        cxpPending,
                        lowStockCount,
                        recentSales
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Dashboard Error] GetSummary: {ex}");
                return StatusCode(500, new { message = "Error al obtener resumen de dashboard", error = ex.Message });
            }
        }

        [HttpGet("Charts")]
        public async Task<IActionResult> GetCharts()
        {
            try
            {
                using (var db = new SqlConnection(_connectionString))
                {
                    Console.WriteLine("[Dashboard] Fetching Real Charts...");

                    // 1. Sales by Hour (Last 24h)
                    var salesByHourSql = @"
                        SELECT 
                            DATEPART(HOUR, Fecha) as Hour, 
                            ISNULL(SUM(Total), 0) as Amount
                        FROM VentasMaster
                        WHERE Fecha >= DATEADD(DAY, -1, GETDATE()) AND Estado <> 'Anulado'
                        GROUP BY DATEPART(HOUR, Fecha)
                        ORDER BY Hour";
                    var salesByHour = await db.QueryAsync(salesByHourSql);

                    // 2. Top 5 Products (Last 30 days)
                    var topProductsSql = @"
                        SELECT TOP 5 a.Descripcion as Name, SUM(d.Cantidad) as Value
                        FROM VentasDetalle d
                        JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                        JOIN VentasMaster v ON d.VentaId = v.Id
                        WHERE v.Fecha >= DATEADD(DAY, -30, GETDATE()) AND v.Estado <> 'Anulado'
                        GROUP BY a.Descripcion
                        ORDER BY Value DESC";
                    var topProducts = await db.QueryAsync(topProductsSql);

                    // 3. Cash status (MetodoPago)
                    var cashStatusSql = @"
                        SELECT MetodoPago as Name, SUM(Total) as Value
                        FROM VentasMaster
                        WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE) AND Estado <> 'Anulado'
                        GROUP BY MetodoPago";
                    var cashStatus = await db.QueryAsync(cashStatusSql);

                    return Ok(new
                    {
                        salesByHour,
                        topProducts,
                        cashStatus
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Dashboard Error] GetCharts: {ex}");
                return StatusCode(500, new { message = "Error al obtener datos de gráficos", error = ex.Message });
            }
        }
    }
}
