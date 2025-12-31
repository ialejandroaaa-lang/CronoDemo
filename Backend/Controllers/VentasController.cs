using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PosCrono.API.Models;
using PosCrono.API.Helpers;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VentasController : ControllerBase
    {
        private readonly string _connectionString;

        public VentasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] VentaDto venta)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            using var tx = db.BeginTransaction();
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Keys
                        .SelectMany(key => ModelState[key].Errors.Select(x => new { Key = key, Error = x.ErrorMessage }))
                        .ToList();

                    Console.WriteLine("[Ventas Warning] Validation Failed:");
                    foreach (var err in errors) { Console.WriteLine($"  - {err.Key}: {err.Error}"); }
                    return BadRequest(new { message = "Datos inválidos", errors });
                }

                // [NEW] Stock Validation
                var articleIds = venta.Detalles.Select(d => d.ArticuloId).Distinct().ToList();
                if (articleIds.Any())
                {
                    var stockQuery = "SELECT Id, Descripcion, StockActual, 0 as PermitirStockNegativo FROM ArticulosMaster WHERE Id IN @Ids";
                    var stocks = (await db.QueryAsync<dynamic>(stockQuery, new { Ids = articleIds }, transaction: tx)).ToDictionary(x => (int)x.Id, x => x);

                    // [NEW] Get Global Config
                    bool allowNegativeStockGlobal = false;
                    try {
                        allowNegativeStockGlobal = await db.QueryFirstOrDefaultAsync<bool>("SELECT TOP 1 AllowNegativeStock FROM ClientConfigurations", transaction: tx);
                    } catch { /* Column might not exist yet, default false */ }

                    foreach (var det in venta.Detalles)
                    {
                        if (stocks.TryGetValue((int)det.ArticuloId, out var articulo))
                        {
                            // Logic: Global Config OR Article Specific Config (if we had it)
                            // We use Global Config for now.
                            
                            bool allowNegative = allowNegativeStockGlobal; 
                            if (!allowNegative && (decimal)articulo.StockActual < det.Cantidad)
                            {
                                return BadRequest(new { message = $"Stock insuficiente para '{articulo.Descripcion}'. Disponible: {articulo.StockActual:N2}, Solicitado: {det.Cantidad:N2}" });
                            }
                        }
                        else
                        {
                             return BadRequest(new { message = $"Artículo ID {det.ArticuloId} no encontrado." });
                        }
                    }
                }



                var seqQuery = "SELECT * FROM NCF_Secuencias WHERE TipoNCF = @Tipo AND Activo = 1";
                var seq = await db.QueryFirstOrDefaultAsync<NCF_Secuencia>(seqQuery, new { Tipo = venta.TipoNCF }, transaction: tx);

                // Ensure we have a sequence; if none, create a default one
                if (seq == null)
                {
                    Console.WriteLine($"[Ventas Warning] No NCF sequence found for TipoNCF={venta.TipoNCF}. Creating default.");
                    // Insert a default sequence (you may adjust values as needed)
                    var insertSql = "INSERT INTO NCF_Secuencias (TipoNCF, Nombre, Prefijo, Desde, Actual, Hasta, Activo) VALUES (@TipoNCF, @Nombre, @Prefijo, @Desde, @Actual, @Hasta, 1); SELECT CAST(SCOPE_IDENTITY() as int);";
                    var newId = await db.QuerySingleAsync<int>(insertSql, new
                    {
                        TipoNCF = "DEFAULT",
                        Nombre = "Secuencia Predeterminada",
                        Prefijo = "A001-",
                        Desde = 1,
                        Actual = 0,
                        Hasta = 99999999
                    }, transaction: tx);
                    // Retrieve the newly created sequence
                    seq = await db.QueryFirstOrDefaultAsync<NCF_Secuencia>("SELECT * FROM NCF_Secuencias WHERE Id = @Id", new { Id = newId }, transaction: tx);
                    // Update venta.TipoNCF to reflect the default one if it was null or not found
                    venta.TipoNCF = seq.TipoNCF;
                }

                // At this point seq is guaranteed
                string fullNCF = null;
                int nextValue = seq.Actual + 1;
                if (nextValue > seq.Hasta)
                {
                    Console.WriteLine($"[Ventas Error] NCF exhausted for {seq.Nombre}");
                    return BadRequest(new { message = $"Se ha agotado la secuencia de NCF para {seq.Nombre}." });
                }
                fullNCF = seq.Prefijo + nextValue.ToString("D8");
                venta.NCF = fullNCF;
                await db.ExecuteAsync("UPDATE NCF_Secuencias SET Actual = @Actual WHERE Id = @Id",
                    new { Actual = nextValue, Id = seq.Id }, transaction: tx);

                // 2. Generate Invoice Number (using DocumentSequences)
                var configSql = "SELECT TOP 1 * FROM DocumentSequences WHERE Code = 'SALES_INVOICE'";
                var seqDoc = await db.QueryFirstOrDefaultAsync<DocumentSequence>(configSql, transaction: tx);

                if (seqDoc == null)
                {
                    // Fallback create if missing
                     await db.ExecuteAsync(
                        "INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length) VALUES ('SALES_INVOICE', 'Factura de Venta', 'FACT-', 0, 6)", 
                        transaction: tx);
                    seqDoc = await db.QueryFirstOrDefaultAsync<DocumentSequence>(configSql, transaction: tx);
                }

                int nextSeq = seqDoc.CurrentValue + 1;
                venta.NumeroFactura = $"{seqDoc.Prefix}{nextSeq.ToString().PadLeft(seqDoc.Length, '0')}";

                // Update Sequence in DB
                await db.ExecuteAsync(
                    "UPDATE DocumentSequences SET CurrentValue = @Val WHERE Id = @Id", 
                    new { Val = nextSeq, Id = seqDoc.Id }, transaction: tx);

                // Ensure Fecha is not null
                if (!venta.Fecha.HasValue) venta.Fecha = DateTime.Now;

                // --- CxC Logic ---
                if (string.IsNullOrEmpty(venta.TerminosPago)) venta.TerminosPago = "Contado";

                // Calculate Due Date
                if (venta.TerminosPago == "Contado")
                {
                    venta.FechaVencimiento = venta.Fecha;
                    
                    // Logic Correction: 
                    // In Distribution mode, "Contado" often means "Immediate Payment Required" but not necessarily "Paid at Checkout counter".
                    // If MontoRecibido is NOT provided (null), we assume it is PENDING PAYMENT (Credit/Debt).
                    // If MontoRecibido IS provided, we use it.

                    decimal received = venta.MontoRecibido ?? 0;
                    venta.Saldo = (venta.Total ?? 0) - received;
                }
                else
                {
                    // Credit Logic
                    int days = 0;
                    if (venta.TerminosPago.Contains("15")) days = 15;
                    else if (venta.TerminosPago.Contains("30")) days = 30;
                    else if (venta.TerminosPago.Contains("45")) days = 45;
                    else if (venta.TerminosPago.Contains("60")) days = 60;
                    
                    venta.FechaVencimiento = venta.Fecha.Value.AddDays(days);
                    
                    // Logic: Total - Received (usually 0)
                     decimal received = venta.MontoRecibido ?? 0;
                     venta.Saldo = (venta.Total ?? 0) - received;
                }
                if (venta.TerminosPago != "Contado")
                {
                    venta.MontoRecibido = 0;
                    venta.Cambio = 0;
                }

                // Determine Status based on Balance
                string estadoVenta = (venta.Saldo > 0) ? "Pendiente de Pago" : "Pagada";

                // 3. Insert Master
                var sqlMaster = @"
                    INSERT INTO VentasMaster (
                        NumeroFactura, Fecha, ClienteId, NCF, TipoNCF,
                        Subtotal, ITBIS, Total, AlmacenId, Usuario, Estado,
                        MetodoPago, MontoRecibido, Cambio, MonedaId, TasaCambio,
                        DescuentoTotal, CodigoPromocion,
                        TerminosPago, Saldo, FechaVencimiento
                    ) VALUES (
                        @NumeroFactura, @Fecha, @ClienteId, @NCF, @TipoNCF,
                        @Subtotal, @ITBIS, @Total, @AlmacenId, @Usuario, @Estado,
                        @MetodoPago, @MontoRecibido, @Cambio, @MonedaId, @TasaCambio,
                        @DescuentoTotal, @CodigoPromocion,
                        @TerminosPago, @Saldo, @FechaVencimiento
                    );
                    SELECT CAST(SCOPE_IDENTITY() as int)";
                
                // Add Estado to the DTO or anon object used for query - Wait, Dapper uses the object properties.
                // VentaDto doesn't have 'Estado' property usually set by client. 
                // We need to pass a new anonymous object or add the property to the DTO if it exists, or extending the params.
                // Best way: Create a dynamic parameters object or just add the property to the anon object if we were using one, but here we are passing 'venta'.
                // 'venta' is VentaDto. Let's check if VentaDto has Estado.
                // Looking at the file, VentaDto DOES NOT have Estado.
                // We need to pass a new object combining 'venta' and 'Estado'.
                
                var insertParams = new DynamicParameters(venta);
                insertParams.Add("Estado", estadoVenta);

                int ventaId = await db.QuerySingleAsync<int>(sqlMaster, insertParams, transaction: tx);

                // 4. Process Details (including inventory updates)
                foreach (var det in venta.Detalles ?? new List<VentaDetalleDto>())
                {
                    det.VentaId = ventaId;
                    if (det.AlmacenId == 0) det.AlmacenId = venta.AlmacenId;

                    // Insert detail line
                    await db.ExecuteAsync(@"
                        INSERT INTO VentasDetalle (
                            VentaId, ArticuloId, Cantidad, PrecioUnitario, ITBIS, TotalLinea, AlmacenId,
                            DescuentoMonto
                        ) VALUES (
                            @VentaId, @ArticuloId, @Cantidad, @PrecioUnitario, @ITBIS, @TotalLinea, @AlmacenId,
                            @DescuentoMonto
                        )", det, transaction: tx);

                    // 1. Deduct Stock and Log Movement
                    // Get current stock (Old Stock)
                    var currentStock = await db.QuerySingleOrDefaultAsync<decimal?>("SELECT StockActual FROM ArticulosMaster WHERE Id = @Id", new { Id = det.ArticuloId }, transaction: tx) ?? 0;
                    
                    decimal stockAnterior = currentStock;
                    decimal stockNuevo = stockAnterior - (det.Cantidad ?? 0);

                    // Update Master
                    await db.ExecuteAsync(@"
                        UPDATE ArticulosMaster
                        SET StockActual = @NewStock
                        WHERE Id = @Id", new { NewStock = stockNuevo, Id = det.ArticuloId }, transaction: tx);

                    // 2. Record Movement (with proper history fields)
                    await db.ExecuteAsync(@"
                        INSERT INTO MovimientosInventario (
                            ArticuloId, FechaMovimiento, TipoMovimiento, Cantidad, CostoUnitario,
                            Referencia, NumeroDocumento, Usuario, AlmacenId, StockAnterior, StockNuevo
                        ) SELECT
                            @ArticuloId, GETDATE(), 'Venta', -@Cantidad, CostoUnitario,
                            @Ref, @NumDoc, @Usr, @AlmacenId, @StockAnterior, @StockNuevo
                        FROM ArticulosMaster WHERE Id = @ArticuloId",
                        new {
                            ArticuloId = det.ArticuloId,
                            Cantidad = det.Cantidad,
                            Ref = $"Venta Factura {venta.NumeroFactura}",
                            NumDoc = venta.NumeroFactura,
                            Usr = venta.Usuario,
                            AlmacenId = det.AlmacenId,
                            StockAnterior = stockAnterior,
                            StockNuevo = stockNuevo
                        }, transaction: tx);
                }

                // 5. Generate Recibo (if paid)
                string? numeroRecibo = null;
                if (venta.MontoRecibido > 0)
                {
                    var reciboConfigSql = "SELECT TOP 1 * FROM ReciboConfiguration WITH (UPDLOCK, ROWLOCK)";
                    var reciboConfig = await db.QueryFirstOrDefaultAsync<ReciboConfiguration>(reciboConfigSql, transaction: tx);
                    if (reciboConfig == null)
                    {
                        await db.ExecuteAsync("INSERT INTO ReciboConfiguration (Prefijo, SecuenciaActual, Longitud) VALUES ('REC', 0, 6)", transaction: tx);
                        reciboConfig = new ReciboConfiguration { Prefijo = "REC", SecuenciaActual = 0, Longitud = 6 };
                    }
                    reciboConfig.SecuenciaActual++;
                    numeroRecibo = $"{reciboConfig.Prefijo}-{reciboConfig.SecuenciaActual.ToString().PadLeft(reciboConfig.Longitud, '0')}";
                    await db.ExecuteAsync("UPDATE ReciboConfiguration SET SecuenciaActual = @SecuenciaActual WHERE Id = @Id",
                        new { reciboConfig.SecuenciaActual, reciboConfig.Id }, transaction: tx);
                    var reciboSql = @"
                        INSERT INTO RecibosMaster (
                            VentaId, NumeroRecibo, Fecha, Monto, MetodoPago, Referencia, Usuario, Estado
                        ) VALUES (
                            @VentaId, @NumeroRecibo, @Fecha, @Monto, @MetodoPago, NULL, @Usuario, 'Activo'
                        )";
                    await db.ExecuteAsync(reciboSql, new {
                        VentaId = ventaId,
                        NumeroRecibo = numeroRecibo,
                        Fecha = DateTime.Now,
                        Monto = venta.MontoRecibido,
                        MetodoPago = venta.MetodoPago,
                        Usuario = venta.Usuario ?? "Sistema"
                    }, transaction: tx);
                }



                // 6. [NEW] Handle Credit Note Payment
                if (venta.CreditNoteId.HasValue)
                {
                     var cnObj = await db.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM CreditNotes WHERE Id = @Id", new { Id = venta.CreditNoteId }, transaction: tx);
                     if (cnObj == null) throw new Exception("Nota de Crédito no válida.");
                     
                     decimal amountToDeduct = venta.MontoPagoCredito ?? venta.Total ?? 0;

                     if (cnObj.Saldo < amountToDeduct) throw new Exception($"Saldo insuficiente en Nota de Crédito. Disponible: {cnObj.Saldo:C2}, Intento de uso: {amountToDeduct:C2}");

                     decimal newBalance = cnObj.Saldo - amountToDeduct;
                     string newState = newBalance == 0 ? "Usado" : "Activo";

                     await db.ExecuteAsync("UPDATE CreditNotes SET Saldo = @Saldo, Estado = @Estado WHERE Id = @Id", 
                        new { Saldo = newBalance, Estado = newState, Id = venta.CreditNoteId }, transaction: tx);
                }

                tx.Commit();

                // Audit Log
                await AuditHelper.LogAsync(db, null, "VentasMaster", ventaId.ToString(), "INSERT", null, venta, venta.Usuario);

                // Return full object to facilitate frontend receipt rendering
                return Ok(new { 
                    id = ventaId, 
                    factura = venta.NumeroFactura, 
                    ncf = fullNCF,
                    fecha = venta.Fecha,
                    subTotal = venta.Subtotal,
                    itbis = venta.ITBIS,
                    total = venta.Total,
                    tipoNCF = venta.TipoNCF,
                    clienteId = venta.ClienteId,
                    numeroRecibo = numeroRecibo,
                    metodoPago = venta.MetodoPago,
                    montoRecibido = venta.MontoRecibido,
                    cambio = venta.Cambio,
                    estado = estadoVenta
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ventas Error] Transaction failed: {ex}");
                try { 
                    System.IO.File.AppendAllText("C:\\POS CRONO\\Backend\\error_log.txt", DateTime.Now + " - " + ex.ToString() + Environment.NewLine);
                } catch { } // ignore logging error
                try { tx.Rollback(); } catch (Exception rbEx) { Console.WriteLine($"[Ventas Error] Rollback failed: {rbEx.Message}"); }
                
                var msg = ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : "");
                return StatusCode(500, new { message = "Error al procesar la venta", error = msg, details = ex.ToString() });
            }
        }

        [HttpGet("CorteCaja")]
        public async Task<IActionResult> GetCorteCaja([FromQuery] string? fecha)
        {
            try
            {
                using var db = new SqlConnection(_connectionString);
                var targetDate = string.IsNullOrEmpty(fecha) ? DateTime.Today : DateTime.Parse(fecha);
                
                var sqlByCurrency = @"
                    SELECT 
                        m.Codigo as Moneda,
                        m.Simbolo,
                        v.MetodoPago,
                        COUNT(v.Id) as Transacciones,
                        SUM(v.Subtotal) as Subtotal,
                        SUM(v.ITBIS) as ITBIS,
                        SUM(v.Total) as Total
                    FROM VentasMaster v
                    LEFT JOIN Monedas m ON v.MonedaId = m.Id
                    WHERE CAST(v.Fecha AS DATE) = CAST(@Fecha AS DATE)
                    AND v.Estado <> 'Anulado'
                    GROUP BY m.Codigo, m.Simbolo, v.MetodoPago";

                var sqlConsolidated = @"
                    SELECT 
                        SUM((v.Total * v.TasaCambio)) as TotalDOP,
                        COUNT(v.Id) as TotalTransacciones
                    FROM VentasMaster v
                    WHERE CAST(v.Fecha AS DATE) = CAST(@Fecha AS DATE)
                    AND v.Estado <> 'Anulado'";

                var details = await db.QueryAsync(sqlByCurrency, new { Fecha = targetDate });
                var summary = await db.QuerySingleOrDefaultAsync(sqlConsolidated, new { Fecha = targetDate });

                return Ok(new {
                    Fecha = targetDate,
                    Detalles = details,
                    Resumen = summary
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al generar corte de caja", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetVentas()
        {
            try
            {
                using var db = new SqlConnection(_connectionString);
                var sql = @"
                    SELECT TOP 100
                        v.Id,
                        v.NumeroFactura,
                        v.Fecha,
                        v.ClienteId,
                        c.Name as ClienteNombre,
                        v.NCF,
                        v.TipoNCF,
                        v.Subtotal,
                        v.ITBIS,
                        v.Total,
                        v.Saldo,
                        v.AlmacenId,
                        v.Usuario,
                        v.Estado,
                        v.MetodoPago,
                        v.MontoRecibido,
                        v.Cambio,
                        v.MonedaId,
                        v.TasaCambio,
                        m.Codigo as MonedaCodigo,
                        m.Simbolo as MonedaSimbolo,
                        'Factura' as Tipo
                    FROM VentasMaster v
                    LEFT JOIN Clients c ON v.ClienteId = c.Id
                    LEFT JOIN Monedas m ON v.MonedaId = m.Id
                    ORDER BY v.Fecha DESC, v.Id DESC";
                var ventas = await db.QueryAsync(sql);
                return Ok(ventas);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ventas Error] Failed to get sales: {ex}");
                return StatusCode(500, new { message = "Error al obtener ventas", error = ex.ToString() });
            }
        }

        [HttpGet("UnifiedHistory")]
        public async Task<IActionResult> GetHistory()
        {
            try
            {
                using var db = new SqlConnection(_connectionString);
                // Unified SQL query to get Sales, Quotations and Returns
                var sql = @"
                    WITH UnifiedHistory AS (
                        SELECT 
                            v.Id, 
                            v.NumeroFactura as Numero, 
                            v.Fecha, 
                            v.ClienteId, 
                            c.Name as ClienteNombre, 
                            CAST(ISNULL(v.NCF, '') as nvarchar(max)) as NCF, 
                            CAST(ISNULL(v.TipoNCF, '') as nvarchar(max)) as TipoNCF, 
                            v.Subtotal, 
                            v.ITBIS, 
                            v.Total, 
                            v.Saldo, 
                            v.Usuario, 
                            v.Estado, 
                            v.MonedaId, 
                            v.TasaCambio, 
                            m.Codigo as MonedaCodigo, 
                            m.Simbolo as MonedaSimbolo,
                            'Factura' as Tipo
                        FROM VentasMaster v
                        LEFT JOIN Clients c ON v.ClienteId = c.Id
                        LEFT JOIN Monedas m ON v.MonedaId = m.Id
                        
                        UNION ALL

                        SELECT 
                            q.Id, 
                            q.NumeroCotizacion as Numero, 
                            q.Fecha, 
                            q.ClienteId, 
                            c.Name as ClienteNombre, 
                            CAST('' as nvarchar(max)) as NCF, 
                            CAST('' as nvarchar(max)) as TipoNCF, 
                            q.Subtotal, 
                            q.ITBIS, 
                            q.Total, 
                            0 as Saldo, 
                            q.Usuario, 
                            q.Estado, 
                            q.MonedaId, 
                            q.TasaCambio, 
                            m.Codigo as MonedaCodigo, 
                            m.Simbolo as MonedaSimbolo,
                            'Cotización' as Tipo
                        FROM CotizacionesMaster q
                        LEFT JOIN Clients c ON q.ClienteId = c.Id
                        LEFT JOIN Monedas m ON q.MonedaId = m.Id

                        UNION ALL

                        SELECT 
                            r.Id, 
                            CAST(r.Id as nvarchar(max)) as Numero, 
                            r.Fecha, 
                            v.ClienteId, 
                            c.Name as ClienteNombre, 
                            CAST(ISNULL(v.NCF, '') as nvarchar(max)) as NCF, 
                            CAST(ISNULL(r.TipoAccion, '') as nvarchar(max)) as TipoNCF, 
                            r.TotalReembolsado as Subtotal, 
                            0 as ITBIS, 
                            r.TotalReembolsado as Total, 
                            0 as Saldo, 
                            r.Usuario, 
                            r.Estado, 
                            v.MonedaId, 
                            v.TasaCambio, 
                            m.Codigo as MonedaCodigo, 
                            m.Simbolo as MonedaSimbolo,
                            'Devolución' as Tipo
                        FROM ReturnsMaster r
                        LEFT JOIN VentasMaster v ON r.VentaId = v.Id
                        LEFT JOIN Clients c ON v.ClienteId = c.Id
                        LEFT JOIN Monedas m ON v.MonedaId = m.Id
                    )
                    SELECT * FROM UnifiedHistory
                    ORDER BY Fecha DESC, Id DESC";

                var history = await db.QueryAsync(sql);
                return Ok(history);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ventas Error] Failed to get history: {ex}");
                return StatusCode(500, new { message = "Error al obtener historial", error = ex.ToString() });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetVenta(int id)
        {
            try
            {
                using var db = new SqlConnection(_connectionString);
                
                // 1. Fetch Master
                var sqlMaster = @"
                    SELECT 
                        v.*,
                        c.Name as ClienteNombre,
                        m.Codigo as MonedaCodigo,
                        m.Simbolo as MonedaSimbolo
                    FROM VentasMaster v
                    LEFT JOIN Clients c ON v.ClienteId = c.Id
                    LEFT JOIN Monedas m ON v.MonedaId = m.Id
                    WHERE v.Id = @Id";
                
                var venta = await db.QuerySingleOrDefaultAsync<VentaDto>(sqlMaster, new { Id = id });
                
                if (venta == null) return NotFound(new { message = "Venta no encontrada" });

                // 2. Fetch Details with Product Info
                var sqlDetails = @"
                    SELECT 
                        d.*, 
                        a.Descripcion, 
                        a.NumeroArticulo as Codigo
                    FROM VentasDetalle d
                    LEFT JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                    WHERE d.VentaId = @Id";

                var detalles = await db.QueryAsync<VentaDetalleDto>(sqlDetails, new { Id = id });
                venta.Detalles = detalles.ToList();

                return Ok(venta);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ventas Error] Failed to get sale {id}: {ex}");
                return StatusCode(500, new { message = "Error al obtener detalle de venta", error = ex.ToString() });
            }
        }

        [HttpGet("NCF/Sequences")]
        public async Task<IActionResult> GetSequences()
        {
            using var db = new SqlConnection(_connectionString);
            var result = await db.QueryAsync<NCF_Secuencia>("SELECT * FROM NCF_Secuencias WHERE Activo = 1");
            
            // DEBUG LOGGING
            Console.WriteLine($"[DEBUG] GetSequences found {result.Count()} records:");
            foreach(var r in result)
            {
                Console.WriteLine($" - ID: {r.Id}, Tipo: '{r.TipoNCF}', Nombre: '{r.Nombre}', Prefijo: '{r.Prefijo}'");
            }
            
            return Ok(result);
        }

        [HttpGet("ByClient/{clientId}")]
        public async Task<IActionResult> GetInvoicesByClient(int clientId)
        {
            try
            {
                Console.WriteLine($"[DEBUG] GetInvoicesByClient Request for ClientID: {clientId}");
                Console.WriteLine($"[DEBUG] Connection String: {_connectionString}"); // Be careful with secrets in prod, ok for local debug
                
                using var db = new SqlConnection(_connectionString);
                
                // DEBUG: Check total sales count
                var countAll = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM VentasMaster");
                Console.WriteLine($"[DEBUG] Total Sales in DB: {countAll}");

                 // DEBUG: Check specific client sales count ignoring status
                var countClient = await db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM VentasMaster WHERE ClienteId = @C", new { C = clientId });
                Console.WriteLine($"[DEBUG] Sales for Client {clientId} (Any Status): {countClient}");

                var sql = @"
                    SELECT 
                        Id, 
                        NumeroFactura, 
                        Fecha, 
                        Total, 
                        Saldo, 
                        NCF 
                    FROM VentasMaster 
                    WHERE ClienteId = @ClientId 
                    -- AND Estado <> 'Anulado'  <-- Commented out for debug
                    ORDER BY Fecha DESC";

                var invoices = await db.QueryAsync(sql, new { ClientId = clientId });
                Console.WriteLine($"[DEBUG] Returning {invoices.Count()} invoices");
                return Ok(invoices);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ventas Error] Failed to get client invoices: {ex}");
                return StatusCode(500, new { message = "Error al obtener facturas del cliente", error = ex.Message });
            }
        }
    }

    public class VentaDto
    {
        public string? NumeroFactura { get; set; }
        public DateTime? Fecha { get; set; }
        public int? ClienteId { get; set; }
        public string? NCF { get; set; }
        public string? TipoNCF { get; set; }
        public decimal? Subtotal { get; set; }
        public decimal? ITBIS { get; set; }
        public decimal? Total { get; set; }
        public int? AlmacenId { get; set; }
        public string? Usuario { get; set; }
        public string? MetodoPago { get; set; }
        public decimal? MontoRecibido { get; set; }
        public decimal? Cambio { get; set; }
        public int? MonedaId { get; set; }
        public decimal? TasaCambio { get; set; }
        public decimal? DescuentoTotal { get; set; }
        public string? CodigoPromocion { get; set; }
        public int? CreditNoteId { get; set; } // [NEW] Link to Credit Note used for payment
        public decimal? MontoPagoCredito { get; set; } // [NEW] Amount to deduct from Credit Note
        
        // New CxC Fields
        public string? TerminosPago { get; set; } // "Contado", "Credit 30", etc.
        public decimal? Saldo { get; set; }
        public DateTime? FechaVencimiento { get; set; }

        public List<VentaDetalleDto>? Detalles { get; set; }
    }

    public class VentaDetalleDto
    {
        public int? VentaId { get; set; }
        public int? ArticuloId { get; set; }
        public decimal? Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
        public decimal? ITBIS { get; set; }
        public decimal? TotalLinea { get; set; }
        public int? AlmacenId { get; set; }
        public decimal? DescuentoMonto { get; set; }
        public decimal? DescuentoPorcentaje { get; set; }
        public string? Descripcion { get; set; } // [NEW] Display
        public string? Codigo { get; set; }      // [NEW] Display
    }

    public class NCF_Secuencia
    {
        public int Id { get; set; }
        public string TipoNCF { get; set; }
        public string Nombre { get; set; }
        public string Prefijo { get; set; }
        public int Actual { get; set; }
        public int Hasta { get; set; }
        public bool Activo { get; set; }
    }
}
