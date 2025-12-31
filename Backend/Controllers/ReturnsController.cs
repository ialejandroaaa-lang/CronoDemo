using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PosCrono.API.Models;
using PosCrono.API.Dtos;
using PosCrono.API.Helpers;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReturnsController : ControllerBase
    {
        private readonly string _connectionString;

        public ReturnsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] ReturnDto ret)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            using var tx = db.BeginTransaction();
            try
            {
                // 1. Get Original Sale to link info
                var venta = await db.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM VentasMaster WHERE Id = @Id", new { Id = ret.VentaId }, transaction: tx);
                if (venta == null) return BadRequest(new { message = "Venta original no encontrada." });

                int clienteId = venta.ClienteId;
                int almacenId = venta.AlmacenId; 

                // 2. Insert ReturnsMaster
                var sqlMaster = @"
                    INSERT INTO ReturnsMaster (VentaId, Fecha, Estado, Razon, TipoAccion, TotalReembolsado, Usuario)
                    VALUES (@VentaId, GETDATE(), 'Completado', @Razon, @TipoAccion, @TotalReembolsado, @Usuario);
                    SELECT CAST(SCOPE_IDENTITY() as int)";
                
                int returnId = await db.QuerySingleAsync<int>(sqlMaster, new { 
                    ret.VentaId, 
                    ret.Razon, 
                    ret.TipoAccion, 
                    ret.TotalReembolsado, 
                    ret.Usuario 
                }, transaction: tx);

                // [NEW] Validation: Check if returns exceed original sale quantity
                // Fetch previous returns for this sale
                var previousReturns = await db.QueryAsync<dynamic>(@"
                    SELECT rd.ArticuloId, SUM(rd.Cantidad) as TotalReturned
                    FROM ReturnsDetail rd
                    JOIN ReturnsMaster rm ON rd.ReturnId = rm.Id
                    WHERE rm.VentaId = @VentaId AND rm.Estado <> 'Anulado'
                    GROUP BY rd.ArticuloId", new { VentaId = ret.VentaId }, transaction: tx);

                // Fetch Original Sale quantities
                var originalDetails = await db.QueryAsync<dynamic>(@"
                    SELECT ArticuloId, Cantidad
                    FROM VentasDetalle
                    WHERE VentaId = @VentaId", new { VentaId = ret.VentaId }, transaction: tx);

                var originalMap = originalDetails.ToDictionary(x => (int)x.ArticuloId, x => (decimal)x.Cantidad);
                var returnedMap = previousReturns.ToDictionary(x => (int)x.ArticuloId, x => (decimal)x.TotalReturned);

                foreach (var det in ret.Detalles)
                {
                    if (originalMap.TryGetValue(det.ArticuloId, out decimal originalQty))
                    {
                        returnedMap.TryGetValue(det.ArticuloId, out decimal alreadyReturned);
                        // The 'ret.Detalles' contains current return attempt
                        // Note: previousReturns includes THIS return? No, we haven't inserted details yet.
                        // Wait, we JUST inserted Master, but not details (loop starts at line 56).
                        // So previousReturns only has PAST returns.
                        
                        if (alreadyReturned + det.Cantidad > originalQty)
                        {
                            throw new Exception($"La cantidad a devolver de artículo {det.ArticuloId} excede la cantidad vendida ({originalQty}) considerando devoluciones previas ({alreadyReturned}).");
                        }
                    }
                    else
                    {
                         throw new Exception($"El artículo {det.ArticuloId} no pertenece a esta venta.");
                    }
                }

                // 3. Process Details and Update Stock
                foreach (var det in ret.Detalles)
                {
                    await db.ExecuteAsync(@"
                        INSERT INTO ReturnsDetail (ReturnId, ArticuloId, Cantidad, PrecioUnitario, RetornarAlStock)
                        VALUES (@ReturnId, @ArticuloId, @Cantidad, @PrecioUnitario, @RetornarAlStock)",
                        new { ReturnId = returnId, det.ArticuloId, det.Cantidad, det.PrecioUnitario, det.RetornarAlStock }, transaction: tx);

                    if (det.RetornarAlStock)
                    {
                        // Get current stock safely within transaction
                        var currentStock = await db.QuerySingleOrDefaultAsync<decimal>("SELECT StockActual FROM ArticulosMaster WHERE Id = @Id", new { Id = det.ArticuloId }, transaction: tx);
                        
                        decimal stockAnterior = currentStock;
                        decimal stockNuevo = currentStock + det.Cantidad;

                        // Update Stock
                        await db.ExecuteAsync("UPDATE ArticulosMaster SET StockActual = @Stock WHERE Id = @Id", 
                            new { Stock = stockNuevo, Id = det.ArticuloId }, transaction: tx);

                        // Log Movement (Populating NumeroDocumento and Stock fields)
                        // Referencia = Verbose Description
                        // NumeroDocumento = Short ID (Dev-Id)
                        await db.ExecuteAsync(@"
                            INSERT INTO MovimientosInventario (ArticuloId, FechaMovimiento, TipoMovimiento, Cantidad, CostoUnitario, Referencia, NumeroDocumento, Usuario, AlmacenId, StockAnterior, StockNuevo)
                            VALUES (@ArticuloId, GETDATE(), 'Devolucion', @Cantidad, 0, @Ref, @NumDoc, @Usr, @AlmacenId, @StockAnterior, @StockNuevo)",
                            new { 
                                det.ArticuloId, 
                                Cantidad = det.Cantidad, 
                                Ref = $"Devolucion Factura {venta.NumeroFactura}", 
                                NumDoc = $"Dev-{returnId}",
                                Usr = ret.Usuario,
                                AlmacenId = almacenId,
                                StockAnterior = stockAnterior,
                                StockNuevo = stockNuevo
                            }, transaction: tx);
                    }
                }

                // 4. Handle Logic per ActionType
                // 4. Handle Logic per ActionType
                int? creditNoteId = null;

                // MAPPING: Frontend sends 'NotaCredito' for 'Cambio' (Credit Note) and 'Efectivo' for 'Reembolso' (Refund)
                // We normalize here or frontend. Let's handle frontend mapping strings too if needed.
                // Assuming standard: "Cambio" (Credit Note), "Reembolso" (Cash Refund)

                string normalizedAction = ret.TipoAccion;
                if (ret.TipoAccion == "NotaCredito") normalizedAction = "Cambio";
                if (ret.TipoAccion == "Efectivo") normalizedAction = "Reembolso";

                if (normalizedAction == "Cambio" || normalizedAction == "Reembolso")
                {
                    // [NEW] Validation: Prevent Cash Refund if original sale is unpaid (Saldo > 0)
                    if (normalizedAction == "Reembolso" && (venta.Saldo ?? 0) > 0)
                    {
                        throw new Exception("No se puede realizar un Reembolso en Efectivo de una factura que no ha sido pagada. Por favor use Nota de Crédito.");
                    }

                    creditNoteId = await CreateCreditNoteAsync(db, tx, clienteId, venta.Id, returnId, ret.TotalReembolsado, ret.Usuario, normalizedAction);
                }
                
                // If "Solo Devolución" (Product w/o Money), we do NOT generate Credit Note
                
                tx.Commit();
                return Ok(new { 
                    ReturnId = returnId, 
                    CreditNoteId = creditNoteId, 
                    Message = "Devolución procesada correctamente." 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Returns Error] Transaction failed: {ex}"); // Added for debugging
                tx.Rollback();
                // Return detailed error
                var msg = ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : "");
                return StatusCode(500, new { message = "Error al procesar devolución", error = msg, details = ex.ToString() });
            }
        }

        private async Task<int> CreateCreditNoteAsync(SqlConnection db, SqlTransaction tx, int clienteId, int ventaId, int returnId, decimal amount, string usuario, string actionType)
        {
            // 1. Get NCF Sequence
            var seq = await db.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM NCF_Secuencias WHERE TipoNCF = '04' AND Activo = 1", transaction: tx);
            if (seq == null) throw new Exception("No existe secuencia de NCF para Nota de Crédito (Tipo 04).");

            int nextVal = seq.Actual + 1;
            if (nextVal > seq.Hasta) throw new Exception("Secuencia NCF agotada.");

            string ncf = seq.Prefijo + nextVal.ToString("D8");

            // Update Sequence
            await db.ExecuteAsync("UPDATE NCF_Secuencias SET Actual = @Actual WHERE Id = @Id", new { Actual = nextVal, Id = seq.Id }, transaction: tx);

            // Determine Status and Balance Impact based on Action Table
            // Reembolso (Cash) -> Status: Pagado, Saldo: 0 (Money out immediately)
            // Cambio (Credit) -> Status: Activo, Saldo: Amount (Credit available for customer)
            
            string estado = "Activo";
            decimal saldo = amount;

            if (actionType == "Reembolso") 
            {
                estado = "Pagado";
                saldo = 0;
            }

            // 2. Create CN
            var sqlCN = @"
                INSERT INTO CreditNotes (ClienteId, VentaOrigenId, ReturnId, NCF, Monto, Saldo, Fecha, Usuario, Estado, Concepto)
                VALUES (@ClienteId, @VentaId, @ReturnId, @NCF, @Monto, @Saldo, GETDATE(), @Usuario, @Estado, @Concepto);
                SELECT CAST(SCOPE_IDENTITY() as int)";

            var id = await db.QuerySingleAsync<int>(sqlCN, new {
                ClienteId = clienteId,
                VentaId = ventaId,
                ReturnId = returnId,
                NCF = ncf,
                Monto = amount,
                Saldo = saldo,
                Usuario = usuario,
                Estado = estado,
                Concepto = $"Generado por {actionType}"
            }, transaction: tx);

            // 3. Update Client Balance ONLY for Credit Note (Cambio)
            // If Client owes money (Positive Balance), Credit Note reduces it.
            // Balance = Debt. So Balance = Balance - Amount.
            if (actionType == "Cambio")
            {
                await db.ExecuteAsync(@"
                    UPDATE Clients 
                    SET Balance = ISNULL(Balance, 0) - @Amount 
                    WHERE Id = @Id", 
                    new { Amount = amount, Id = clienteId }, transaction: tx);
            }

            return id;
        }
        
        [HttpGet("Search/{invoiceNumber}")]
        public async Task<IActionResult> GetSaleForReturn(string invoiceNumber)
        {
            using var db = new SqlConnection(_connectionString);
            var sqlMaster = "SELECT * FROM VentasMaster WHERE NumeroFactura = @Inv";
            var venta = await db.QueryFirstOrDefaultAsync<dynamic>(sqlMaster, new { Inv = invoiceNumber });
            
            if (venta == null) return NotFound(new { message = "Factura no encontrada." });

            // 1. Get Original Details
            var sqlDetail = @"
                SELECT d.*, a.Descripcion as ArticuloDescripcion 
                FROM VentasDetalle d
                JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                WHERE d.VentaId = @Id";
            var details = (await db.QueryAsync<ReturnDetailDto>(sqlDetail, new { Id = venta.Id })).ToList();

            // 2. Get Previously Returned Quantities
            var sqlReturned = @"
                SELECT rd.ArticuloId, SUM(rd.Cantidad) as TotalReturned
                FROM ReturnsDetail rd
                JOIN ReturnsMaster rm ON rd.ReturnId = rm.Id
                WHERE rm.VentaId = @Id AND rm.Estado <> 'Anulado'
                GROUP BY rd.ArticuloId";
            var returnedItems = await db.QueryAsync<dynamic>(sqlReturned, new { Id = venta.Id });
            var returnedMap = returnedItems.ToDictionary(x => (int)x.ArticuloId, x => (decimal)x.TotalReturned);

            // 3. Calculate Remainder per item
            foreach (var d in details)
            {
                decimal returned = 0;
                if (returnedMap.TryGetValue(d.ArticuloId, out var r)) returned = r;
                
                // Show only ensuring remaining quantity
                d.Cantidad = d.Cantidad - returned;
            }

            // 4. Filter out fully returned items
            var availableDetails = details.Where(d => d.Cantidad > 0).ToList();

            if (availableDetails.Count == 0)
            {
                return BadRequest(new { message = "Esta factura ya ha sido devuelta en su totalidad." });
            }

            return Ok(new { Venta = venta, Detalles = availableDetails });
        }

        // New endpoint: detailed return report for accounting
        [HttpGet("Report/{returnId}")]
        public async Task<IActionResult> GetReturnReport(int returnId)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            var master = await db.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM ReturnsMaster WHERE Id = @Id", new { Id = returnId });
            if (master == null) return NotFound(new { message = "Devolución no encontrada." });
            var details = await db.QueryAsync<dynamic>("SELECT * FROM ReturnsDetail WHERE ReturnId = @Id", new { Id = returnId });
            decimal totalCalculated = 0;
            foreach (var d in details)
            {
                totalCalculated += (decimal)d.Cantidad * (decimal)d.PrecioUnitario;
            }
            var report = new {
                Master = master,
                Detalles = details,
                TotalCalculado = totalCalculated,
                TotalesCoinciden = Math.Abs(totalCalculated - (decimal)master.TotalReembolsado) < 0.01m
            };
            return Ok(report);
        }
        // GET: api/Returns
        [HttpGet]
        public async Task<IActionResult> GetList([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            using var db = new SqlConnection(_connectionString);
            
            // Adjust end date to capture full day (next day midnight)
            DateTime? endAdjusted = end.HasValue ? end.Value.Date.AddDays(1) : (DateTime?)null;

            var sql = @"
                SELECT r.*, v.NumeroFactura, c.Name as ClienteNombre 
                FROM ReturnsMaster r
                JOIN VentasMaster v ON r.VentaId = v.Id
                LEFT JOIN Clients c ON v.ClienteId = c.Id
                WHERE (@Start IS NULL OR r.Fecha >= @Start) 
                  AND (@End IS NULL OR r.Fecha < @End)
                ORDER BY r.Fecha DESC";
            
            var list = await db.QueryAsync<dynamic>(sql, new { Start = start, End = endAdjusted });
            return Ok(list);
        }
    }
}
