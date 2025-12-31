using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SmartListController : ControllerBase
    {
        private readonly string _connectionString;

        public SmartListController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        }

        // 1. SmartList: Facturas de Compra Detalladas
        [HttpGet("Facturas")]
        public async Task<IActionResult> GetFacturas()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    c.Id,
                    c.NumeroCompra as [Numero],
                    c.FechaCompra as [Fecha],
                    p.RazonSocial as [Proveedor],
                    p.CodigoProveedor as [Cod_Proveedor],
                    m.Codigo as [Moneda],
                    m.Simbolo as [Simbolo],
                    c.Total as [Total],
                    c.Saldo as [Saldo],
                    c.Estado as [Estado],
                    a.Nombre as [Almacen],
                    c.TerminosPago as [Terminos],
                    DATEDIFF(day, c.FechaCompra, GETDATE()) as [Antiguedad]
                FROM ComprasMaster c
                JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                JOIN Monedas m ON c.MonedaId = m.Id
                LEFT JOIN Almacenes a ON c.AlmacenId = a.Id
                WHERE c.Estado <> 'Anulado'
                ORDER BY c.FechaCompra DESC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 2. SmartList: Detalle de Artículos Comprados
        [HttpGet("Articulos")]
        public async Task<IActionResult> GetArticulos()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    d.Id,
                    c.NumeroCompra as [Factura],
                    c.FechaCompra as [Fecha],
                    p.RazonSocial as [Proveedor],
                    a.NumeroArticulo as [Cod_Articulo],
                    a.Descripcion as [Articulo],
                    d.Cantidad as [Cantidad],
                    d.UnidadMedida as [Unidad],
                    d.CostoUnitario as [Costo],
                    d.TotalLinea as [Total_Linea],
                    m.Codigo as [Moneda],
                    alm.Nombre as [Almacen]
                FROM ComprasDetalle d
                JOIN ComprasMaster c ON d.CompraId = c.Id
                JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                JOIN Monedas m ON c.MonedaId = m.Id
                LEFT JOIN Almacenes alm ON d.AlmacenId = alm.Id
                WHERE c.Estado <> 'Anulado'
                ORDER BY c.FechaCompra DESC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 3. SmartList: Proveedores y Balances
        [HttpGet("Proveedores")]
        public async Task<IActionResult> GetProveedores()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    p.Id,
                    p.CodigoProveedor as [Codigo],
                    p.RazonSocial as [Proveedor],
                    p.NumeroDocumento as [RNC],
                    p.Telefono as [Telefono],
                    p.Correo as [Email],
                    SUM(CASE WHEN c.Estado <> 'Anulado' THEN c.Total ELSE 0 END) as [Total_Comprado],
                    SUM(c.Saldo) as [Saldo_Pendiente],
                    COUNT(CASE WHEN c.Estado <> 'Anulado' THEN c.Id ELSE NULL END) as [Cant_Facturas]
                FROM ProveedoresMaster p
                LEFT JOIN ComprasMaster c ON p.Id = c.ProveedorId
                GROUP BY p.Id, p.CodigoProveedor, p.RazonSocial, p.NumeroDocumento, p.Telefono, p.Correo
                ORDER BY [Proveedor] ASC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 4. SmartList: Pagos Aplicados
        [HttpGet("Pagos")]
        public async Task<IActionResult> GetPagos()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    pm.Id,
                    pm.Id as [No_Pago],
                    pm.Fecha as [Fecha],
                    p.RazonSocial as [Proveedor],
                    pd.MontoAplicado as [Monto_A_Factura],
                    c.NumeroCompra as [Factura_Afectada],
                    pm.Metodo as [Metodo],
                    pm.Referencia as [Referencia],
                    pm.Estado as [Estado_Pago]
                FROM PagosMaster pm
                JOIN PagosDetalle pd ON pm.Id = pd.PagoId
                JOIN ComprasMaster c ON pd.CompraId = c.Id
                JOIN ProveedoresMaster p ON pm.ProveedorId = p.Id
                WHERE pm.Estado <> 'Anulado'
                ORDER BY pm.Fecha DESC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 5. SmartList: Inventario por Almacén
        [HttpGet("StockAlmacen")]
        public async Task<IActionResult> GetStockAlmacen()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    a.Id,
                    ISNULL(alm.Nombre, a.AlmacenPrincipal) as [Almacen],
                    a.NumeroArticulo as [Codigo],
                    a.Descripcion as [Articulo],
                    a.UnidadMedida as [Unidad],
                    a.StockActual as [Stock_Total],
                    a.CostoUnitario as [Costo_Ultimo],
                    (a.StockActual * a.CostoUnitario) as [Valor_Inventario]
                FROM ArticulosMaster a
                LEFT JOIN Almacenes alm ON (ISNUMERIC(a.AlmacenPrincipal) = 1 AND a.AlmacenPrincipal = CAST(alm.Id AS NVARCHAR))
                ORDER BY Almacen, a.Descripcion";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        // 6. SmartList: Cobros de Ventas
        [HttpGet("Cobros")]
        public async Task<IActionResult> GetCobros()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    v.Id,
                    v.Fecha as [Fecha],
                    v.NumeroFactura as [No_Factura],
                    c.Name as [Cliente],
                    v.NCF as [NCF],
                    v.MetodoPago as [Metodo_Pago],
                    v.MontoRecibido as [Monto_Recibido],
                    v.Cambio as [Cambio],
                    v.Total as [Total],
                    v.Estado as [Estado]
                FROM VentasMaster v
                LEFT JOIN Clients c ON v.ClienteId = c.Id
                WHERE v.Estado <> 'Anulado'
                ORDER BY v.Fecha DESC";
            
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }
    }
}
