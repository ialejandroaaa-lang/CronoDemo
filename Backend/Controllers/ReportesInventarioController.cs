using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportesInventarioController : ControllerBase
    {
        private readonly string _connectionString;

        public ReportesInventarioController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        }

        // GET: api/ReportesInventario/Valoracion
        [HttpGet("Valoracion")]
        public async Task<IActionResult> GetValoracion()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    // 1. Get current stock and current costs
                    var sqlArticulos = @"
                        SELECT Id, NumeroArticulo, Descripcion, StockActual, CostoUnitario, CostoEstandar 
                        FROM ArticulosMaster 
                        WHERE StockActual > 0";
                    
                    var articulos = (await connection.QueryAsync<ArticuloValoracionDto>(sqlArticulos)).ToList();

                    // 2. Get history for FIFO/LIFO
                    // We only need 'Entrada' movements
                    var sqlMovimientos = @"
                        SELECT ArticuloId, Cantidad, CostoUnitario, FechaMovimiento 
                        FROM MovimientosInventario 
                        WHERE TipoMovimiento = 'Entrada' 
                        ORDER BY FechaMovimiento DESC"; // Default DESC for FIFO

                    var movimientos = (await connection.QueryAsync<MovimientoValDto>(sqlMovimientos)).ToList();
                    var movimientosByArticulo = movimientos.GroupBy(m => m.ArticuloId).ToDictionary(g => g.Key, g => g.ToList());

                    var result = new List<ValoracionRowDto>();

                    foreach (var art in articulos)
                    {
                        var row = new ValoracionRowDto
                        {
                            Id = art.Id,
                            NumeroArticulo = art.NumeroArticulo,
                            Descripcion = art.Descripcion,
                            StockActual = art.StockActual
                        };

                        // A. Promedio (Weighted Average is kept in CostoUnitario)
                        row.CostoPromedio = art.CostoUnitario;
                        row.TotalPromedio = art.StockActual * art.CostoUnitario;

                        // B. Estandar
                        row.CostoEstandar = art.CostoEstandar;
                        row.TotalEstandar = art.StockActual * art.CostoEstandar;

                        // C. FIFO (First In First Out) -> Ending Inventory is valued at LATEST costs
                        // Iterate movements DESC (newest first)
                        if (movimientosByArticulo.ContainsKey(art.Id))
                        {
                            var movs = movimientosByArticulo[art.Id]; // Already DESC
                            decimal remainingStock = art.StockActual;
                            decimal valueFIFO = 0;
                            
                            foreach (var mov in movs)
                            {
                                if (remainingStock <= 0) break;

                                decimal qtyToTake = Math.Min(remainingStock, mov.Cantidad);
                                valueFIFO += qtyToTake * mov.CostoUnitario;
                                remainingStock -= qtyToTake;
                            }
                            
                            // If stock remains (e.g. initial stock not in movements), valuate at current Avg or Last cost
                            if (remainingStock > 0)
                            {
                                valueFIFO += remainingStock * art.CostoUnitario; 
                            }

                            row.TotalFIFO = valueFIFO;
                            row.CostoFIFO = art.StockActual > 0 ? valueFIFO / art.StockActual : 0;
                        }
                        else
                        {
                            // No movements, fallback to current cost
                            row.TotalFIFO = row.TotalPromedio;
                            row.CostoFIFO = row.CostoPromedio;
                        }

                        // D. LIFO (Last In First Out) -> Ending Inventory is valued at OLDEST costs
                        // Iterate movements ASC (oldest first). 
                        // Note: Strictly LIFO is complex because you 'consume' from newest. 
                        // Simplified Valuation: Valid stock is composed of the *oldest* layers.
                        if (movimientosByArticulo.ContainsKey(art.Id))
                        {
                            var movs = movimientosByArticulo[art.Id].OrderBy(m => m.FechaMovimiento).ToList(); // ASC
                            decimal remainingStock = art.StockActual;
                            decimal valueLIFO = 0;
                            
                            foreach (var mov in movs)
                            {
                                if (remainingStock <= 0) break;

                                decimal qtyToTake = Math.Min(remainingStock, mov.Cantidad);
                                valueLIFO += qtyToTake * mov.CostoUnitario;
                                remainingStock -= qtyToTake;
                            }
                             
                            if (remainingStock > 0)
                            {
                                valueLIFO += remainingStock * art.CostoUnitario;
                            }

                            row.TotalLIFO = valueLIFO;
                            row.CostoLIFO = art.StockActual > 0 ? valueLIFO / art.StockActual : 0;
                        }
                        else
                        {
                            row.TotalLIFO = row.TotalPromedio;
                            row.CostoLIFO = row.CostoPromedio;
                        }

                        result.Add(row);
                    }

                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al calcular valoración", error = ex.Message });
            }
        }
        
        // GET: api/ReportesInventario/Transacciones
        [HttpGet("Transacciones")]
        public async Task<IActionResult> GetTransacciones([FromQuery] DateTime? fechaInicio, [FromQuery] DateTime? fechaFin)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            c.Id,
                            c.NumeroCompra as Documento,
                            c.FechaCompra,
                            p.RazonSocial as Proveedor,
                            c.Total,
                            c.MonedaId,
                            m.Codigo as MonedaCodigo,
                            m.Simbolo as MonedaSimbolo,
                            c.TasaCambio
                        FROM ComprasMaster c
                        LEFT JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                        LEFT JOIN Monedas m ON c.MonedaId = m.Id
                        WHERE (@FechaInicio IS NULL OR c.FechaCompra >= @FechaInicio)
                          AND (@FechaFin IS NULL OR c.FechaCompra <= @FechaFin)
                        ORDER BY c.FechaCompra DESC";

                    var compras = await connection.QueryAsync<dynamic>(sql, new { FechaInicio = fechaInicio, FechaFin = fechaFin });

                    var result = compras.Select(c => {
                        decimal total = (decimal)c.Total;
                        decimal tasa = c.TasaCambio != null ? (decimal)c.TasaCambio : 1;
                        string moneda = c.MonedaCodigo ?? "DOP";
                        
                        decimal montoDOP = 0;
                        decimal montoUSD = 0;

                        if (moneda == "USD")
                        {
                            montoUSD = total;
                            montoDOP = total * tasa;
                        }
                        else // Assumes DOP or other functional
                        {
                            montoDOP = total;
                            // Conversión inversa simplificada, idealmente buscaría tasa histórica inversa
                            montoUSD = tasa > 0 ? total / tasa : 0; 
                        }

                        return new TransaccionReporteDto
                        {
                            Id = (int)c.Id,
                            Documento = (string)c.Documento,
                            Fecha = (DateTime)c.FechaCompra,
                            Proveedor = (string)c.Proveedor,
                            MonedaOriginal = moneda,
                            MontoOriginal = total,
                            MontoDOP = montoDOP,
                            MontoUSD = montoUSD
                        };
                    });

                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener reporte de transacciones", error = ex.Message });
            }
        }
    }

    public class ArticuloValoracionDto
    {
        public int Id { get; set; }
        public string? NumeroArticulo { get; set; }
        public string? Descripcion { get; set; }
        public decimal StockActual { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal CostoEstandar { get; set; }
    }

    public class MovimientoValDto
    {
        public int ArticuloId { get; set; }
        public decimal Cantidad { get; set; }
        public decimal CostoUnitario { get; set; }
        public DateTime FechaMovimiento { get; set; }
    }

    public class ValoracionRowDto
    {
        public int Id { get; set; }
        public string? NumeroArticulo { get; set; }
        public string? Descripcion { get; set; }
        public decimal StockActual { get; set; }
        
        // Promedio
        public decimal CostoPromedio { get; set; }
        public decimal TotalPromedio { get; set; }

        // FIFO
        public decimal CostoFIFO { get; set; }
        public decimal TotalFIFO { get; set; }

        // LIFO
        public decimal CostoLIFO { get; set; }
        public decimal TotalLIFO { get; set; }

        // Estandar
        public decimal CostoEstandar { get; set; }
        public decimal TotalEstandar { get; set; }
    }
    public class TransaccionReporteDto
    {
        public int Id { get; set; }
        public string? Documento { get; set; }
        public DateTime Fecha { get; set; }
        public string? Proveedor { get; set; }
        public string? MonedaOriginal { get; set; }
        public decimal MontoOriginal { get; set; }
        public decimal MontoDOP { get; set; } // Columna en Pesos
        public decimal MontoUSD { get; set; } // Columna en Dolares
    }
}
