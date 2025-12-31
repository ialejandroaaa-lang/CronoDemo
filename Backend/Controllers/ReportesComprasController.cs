using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportesComprasController : ControllerBase
    {
        private readonly string _connectionString;

        public ReportesComprasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // 1. Resumen General (Totales por Moneda)
        [HttpGet("Resumen")]
        public async Task<IActionResult> GetResumen([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            using var db = new SqlConnection(_connectionString);
            
            var usdRate = await db.ExecuteScalarAsync<decimal?>(@"
                SELECT TOP 1 Tasa 
                FROM TasasCambio 
                WHERE MonedaId = (SELECT Id FROM Monedas WHERE Codigo = 'USD') 
                ORDER BY FechaInicio DESC") ?? 1;

            var sql = @"
                SELECT 
                    m.Codigo as [moneda],
                    m.Simbolo as [monedaSimbolo],
                    COUNT(c.Id) as [cantidadCompras],
                    SUM(c.SubTotal) as [subTotal],
                    SUM(c.Impuestos) as [impuesto],
                    SUM(c.Total) as [total],
                    SUM(CASE WHEN m.Codigo = 'DOP' THEN c.Total ELSE c.Total * ISNULL(c.TasaCambio, 1) END) as [totalDOP],
                    SUM(CASE WHEN m.Codigo = 'USD' THEN c.Total ELSE (c.Total * ISNULL(c.TasaCambio, 1)) / @usdRate END) as [totalUSD]
                FROM ComprasMaster c
                JOIN Monedas m ON c.MonedaId = m.Id
                WHERE (@desde IS NULL OR c.FechaCompra >= @desde)
                  AND (@hasta IS NULL OR c.FechaCompra < DATEADD(day, 1, @hasta))
                  AND c.Estado <> 'Anulado'
                GROUP BY m.Codigo, m.Simbolo";
            
            var result = await db.QueryAsync(sql, new { desde, hasta, usdRate });
            return Ok(result);
        }

        // 2. Compras por Proveedor
        [HttpGet("PorProveedor")]
        public async Task<IActionResult> GetPorProveedor([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            using var db = new SqlConnection(_connectionString);

            // Get latest USD rate
            var usdRate = await db.ExecuteScalarAsync<decimal?>(@"
                SELECT TOP 1 Tasa 
                FROM TasasCambio 
                WHERE MonedaId = (SELECT Id FROM Monedas WHERE Codigo = 'USD') 
                ORDER BY FechaInicio DESC") ?? 1;

            var sql = @"
                SELECT 
                    p.RazonSocial as [proveedor],
                    COUNT(c.Id) as [facturas],
                    SUM(CASE WHEN m.Codigo = 'DOP' THEN c.Total ELSE c.Total * ISNULL(c.TasaCambio, 1) END) as [totalDOP],
                    SUM(CASE WHEN m.Codigo = 'USD' THEN c.Total ELSE (c.Total * ISNULL(c.TasaCambio, 1)) / @usdRate END) as [totalUSD]
                FROM ComprasMaster c
                JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                JOIN Monedas m ON c.MonedaId = m.Id
                WHERE (@desde IS NULL OR c.FechaCompra >= @desde)
                  AND (@hasta IS NULL OR c.FechaCompra < DATEADD(day, 1, @hasta))
                GROUP BY p.RazonSocial
                ORDER BY [proveedor] ASC";
            
            var result = await db.QueryAsync(sql, new { desde, hasta, usdRate });
            return Ok(result);
        }

        // 3. Compras por Artículo (Ranking)
        [HttpGet("PorArticulo")]
        public async Task<IActionResult> GetPorArticulo([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    a.NumeroArticulo as [numeroArticulo],
                    a.Descripcion as [articulo],
                    SUM(d.Cantidad) as [cantidadComprada],
                    AVG(d.CostoUnitario) as [costoPromedio],
                    SUM(d.TotalLinea) as [totalSinImpuestos]
                FROM ComprasDetalle d
                JOIN ComprasMaster c ON d.CompraId = c.Id
                JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                WHERE (@desde IS NULL OR c.FechaCompra >= @desde)
                  AND (@hasta IS NULL OR c.FechaCompra < DATEADD(day, 1, @hasta))
                GROUP BY a.NumeroArticulo, a.Descripcion
                ORDER BY [cantidadComprada] DESC";
            
            var result = await db.QueryAsync(sql, new { desde, hasta });
            return Ok(result);
        }

        // 4. Reporte de Antigüedad de Saldos (Aging)
        [HttpGet("AntiguedadSaldos")]
        public async Task<IActionResult> GetAntiguedad()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    p.RazonSocial as [proveedor],
                    SUM(CASE WHEN DATEDIFF(day, c.FechaCompra, GETDATE()) <= 30 THEN c.Saldo ELSE 0 END) as [0_30_dias],
                    SUM(CASE WHEN DATEDIFF(day, c.FechaCompra, GETDATE()) BETWEEN 31 AND 60 THEN c.Saldo ELSE 0 END) as [31_60_dias],
                    SUM(CASE WHEN DATEDIFF(day, c.FechaCompra, GETDATE()) BETWEEN 61 AND 90 THEN c.Saldo ELSE 0 END) as [61_90_dias],
                    SUM(CASE WHEN DATEDIFF(day, c.FechaCompra, GETDATE()) > 90 THEN c.Saldo ELSE 0 END) as [mas_90_dias],
                    SUM(c.Saldo) as [saldoTotal]
                FROM ComprasMaster c
                JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                WHERE c.Saldo > 0
                GROUP BY p.RazonSocial
                ORDER BY saldoTotal DESC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 5. Facturas Pendientes Detalladas
        [HttpGet("FacturasPendientes")]
        public async Task<IActionResult> GetFacturasPendientes()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    c.NumeroCompra as [numeroCompra],
                    c.FechaCompra as [fechaCompra],
                    p.RazonSocial as [proveedor],
                    m.Codigo as [moneda],
                    m.Simbolo as [monedaSimbolo],
                    c.Total as [total],
                    c.Saldo as [saldo],
                    DATEDIFF(day, c.FechaCompra, GETDATE()) as [diasVencimiento]
                FROM ComprasMaster c
                JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                JOIN Monedas m ON c.MonedaId = m.Id
                WHERE c.Saldo > 0 AND c.Estado <> 'Anulado'
                ORDER BY c.FechaCompra ASC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 6. Get Invoice Header and Line Items by invoice number
        [HttpGet("Factura/{numero}")]
        public async Task<IActionResult> GetFactura(string numero)
        {
            using var db = new SqlConnection(_connectionString);
            var sqlHeader = @"SELECT c.Id, c.NumeroCompra as [numeroCompra], c.FechaCompra as [fechaCompra], 
                                  p.RazonSocial as [proveedor], m.Codigo as [moneda], m.Simbolo as [monedaSimbolo],
                                  c.Total as [total], c.Saldo as [saldo], a.Nombre as [almacenNombre]
                             FROM ComprasMaster c
                             JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                             JOIN Monedas m ON c.MonedaId = m.Id
                             LEFT JOIN Almacenes a ON c.AlmacenId = a.Id
                             WHERE c.NumeroCompra = @numero";
            var header = await db.QueryFirstOrDefaultAsync(sqlHeader, new { numero });
            if (header == null) return NotFound();

            var sqlItems = @"SELECT d.ArticuloId as [articuloId], a.NumeroArticulo as [numeroArticulo], 
                                    a.Descripcion as [descripcion], d.Cantidad as [cantidad], 
                                    d.CostoUnitario as [costoUnitario], d.TotalLinea as [totalLinea],
                                    alm.Nombre as [almacenLinea]
                             FROM ComprasDetalle d
                             JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                             LEFT JOIN Almacenes alm ON d.AlmacenId = alm.Id
                             WHERE d.CompraId = @compraId";
            var items = await db.QueryAsync(sqlItems, new { compraId = header.Id });

            var sqlNotas = @"SELECT n.Id as [notaId], n.Tipo as [tipo], n.Fecha as [fecha], 
                                    nd.MontoAplicado as [monto], n.Referencia as [referencia],
                                    n.Estado as [estado]
                              FROM NotasDetalle nd
                              JOIN NotasMaster n ON nd.NotaId = n.Id
                              WHERE nd.CompraId = @compraId AND n.Estado <> 'Anulada'";
            var notas = await db.QueryAsync(sqlNotas, new { compraId = header.Id });

            return Ok(new { header, items, notas });
        }

        // 7. Search Invoices with filters
        [HttpGet("BuscarFacturas")]
        public async Task<IActionResult> BuscarFacturas([FromQuery] BuscarFacturasFiltro filtro)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"SELECT c.NumeroCompra as [numeroCompra], c.FechaCompra as [fechaCompra], 
                               p.RazonSocial as [proveedor], m.Codigo as [moneda], m.Simbolo as [monedaSimbolo],
                               c.Total as [total], c.Saldo as [saldo],
                             CASE WHEN c.Saldo > 0 THEN 'Pendiente' ELSE 'Pagado' END as [estado]
                         FROM ComprasMaster c
                         JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                         JOIN Monedas m ON c.MonedaId = m.Id
                         WHERE 1=1";
            var conditions = new List<string>();
            var parameters = new DynamicParameters();
            
            if (!string.IsNullOrEmpty(filtro.Numero)) { conditions.Add("c.NumeroCompra LIKE @numero"); parameters.Add("numero", "%" + filtro.Numero + "%"); }
            if (!string.IsNullOrEmpty(filtro.Proveedor)) { conditions.Add("p.RazonSocial LIKE @proveedor"); parameters.Add("proveedor", "%" + filtro.Proveedor + "%"); }
            
            if (!string.IsNullOrEmpty(filtro.Desde) && DateTime.TryParse(filtro.Desde, out var dDesde)) 
            { 
                conditions.Add("c.FechaCompra >= @desde"); parameters.Add("desde", dDesde); 
            }
            
            if (!string.IsNullOrEmpty(filtro.Hasta) && DateTime.TryParse(filtro.Hasta, out var dHasta)) 
            { 
                conditions.Add("c.FechaCompra < DATEADD(day,1,@hasta)"); parameters.Add("hasta", dHasta); 
            }
            
            if (!string.IsNullOrEmpty(filtro.Estado)) { conditions.Add("(c.Saldo > 0 AND @estado = 'Pendiente') OR (c.Saldo = 0 AND @estado = 'Pagado')"); parameters.Add("estado", filtro.Estado); }
            
            if (conditions.Count > 0) sql += " AND " + string.Join(" AND ", conditions);
            var result = await db.QueryAsync(sql, parameters);
            return Ok(result);
        }

        // 8. Get Payments for a specific invoice
        [HttpGet("PagosPorFactura/{numero}")]
        public async Task<IActionResult> GetPagosPorFactura(string numero)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"SELECT 
                            pg.Id as [pagoId], 
                            pg.Fecha as [fechaPago], 
                            pd.MontoAplicado as [monto], 
                            pg.Metodo as [metodoPago],
                            pg.Estado as [estadoPago]
                         FROM PagosMaster pg
                         JOIN PagosDetalle pd ON pg.Id = pd.PagoId
                         JOIN ComprasMaster c ON pd.CompraId = c.Id
                         WHERE LTRIM(RTRIM(c.NumeroCompra)) = LTRIM(RTRIM(@numero))
                           AND pg.Estado <> 'Anulado'";
            var pagos = await db.QueryAsync(sql, new { numero });
            return Ok(pagos);
        }

        // 9. Compras por Almacén
        [HttpGet("PorAlmacen")]
        public async Task<IActionResult> GetPorAlmacen([FromQuery] DateTime? desde, [FromQuery] DateTime? hasta)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    ISNULL(a.Nombre, 'Sin Almacén') as [almacen],
                    COUNT(c.Id) as [cantidadCompras],
                    SUM(CASE WHEN m.Codigo = 'DOP' THEN c.Total ELSE c.Total * ISNULL(c.TasaCambio, 1) END) as [totalDOP]
                FROM ComprasMaster c
                LEFT JOIN Almacenes a ON c.AlmacenId = a.Id
                JOIN Monedas m ON c.MonedaId = m.Id
                WHERE (@desde IS NULL OR c.FechaCompra >= @desde)
                  AND (@hasta IS NULL OR c.FechaCompra < DATEADD(day, 1, @hasta))
                  AND c.Estado <> 'Anulado'
                GROUP BY a.Nombre
                ORDER BY [totalDOP] DESC";
            
            var result = await db.QueryAsync(sql, new { desde, hasta });
            return Ok(result);
        }
    }

    public class BuscarFacturasFiltro
    {
        public string? Numero { get; set; }
        public string? Proveedor { get; set; }
        public string? Desde { get; set; }
        public string? Hasta { get; set; }
        public string? Estado { get; set; }
    }
}
