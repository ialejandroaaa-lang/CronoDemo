using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;
using PosCrono.API.Helpers;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComprasController : ControllerBase
    {
        private readonly string _connectionString;

        public ComprasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("ping")]
        public IActionResult Ping() => Ok("pong");

        // GET: api/Compras
        [HttpGet]
        public async Task<IActionResult> GetCompras()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            c.*, 
                            p.RazonSocial as ProveedorNombre,
                            m.Codigo as MonedaCodigo,
                            m.Simbolo as MonedaSimbolo,
                            m.EsFuncional as MonedaEsFuncional,
                            c.TipoDocumento,
                            c.DocumentoReferenciaId,
                            c.Estado,
                            ref.NumeroCompra as DocumentoReferenciaNumero,
                            CAST(CASE WHEN EXISTS (SELECT 1 FROM ComprasMaster WHERE DocumentoReferenciaId = c.Id AND Estado <> 'Anulado') THEN 1 ELSE 0 END AS BIT) as YaTransferido
                        FROM ComprasMaster c
                        LEFT JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                        LEFT JOIN Monedas m ON c.MonedaId = m.Id
                        LEFT JOIN ComprasMaster ref ON c.DocumentoReferenciaId = ref.Id
                        ORDER BY c.FechaCompra DESC";
                    
                    var compras = await connection.QueryAsync<CompraListDto>(sql);
                    return Ok(compras);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener compras", error = ex.Message });
            }
        }

        // GET: api/Compras/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetCompra(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sqlHeader = @"
                        SELECT c.*, p.RazonSocial as ProveedorNombre, p.CodigoProveedor
                        FROM ComprasMaster c
                        LEFT JOIN ProveedoresMaster p ON c.ProveedorId = p.Id
                        WHERE c.Id = @Id";

                    var sqlDetails = "SELECT * FROM ComprasDetalle WHERE CompraId = @Id";

                    using (var multi = await connection.QueryMultipleAsync(sqlHeader + ";" + sqlDetails, new { Id = id }))
                    {
                        var compra = await multi.ReadSingleOrDefaultAsync<CompraDto>();
                        if (compra == null) return NotFound();

                        compra.Detalles = (await multi.ReadAsync<CompraDetalleDto>()).ToList();
                        return Ok(compra);
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener compra", error = ex.Message });
            }
        }

        // POST: api/Compras
        [HttpPost]
        public async Task<IActionResult> CreateCompra([FromBody] CompraDto compra)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 0. Validation: Avoid duplicate transfers
                            if (compra.DocumentoReferenciaId.HasValue)
                            {
                                var alreadyTransferred = await connection.ExecuteScalarAsync<bool>(
                                    "SELECT CASE WHEN EXISTS (SELECT 1 FROM ComprasMaster WHERE DocumentoReferenciaId = @RefId AND Estado <> 'Anulado') THEN 1 ELSE 0 END",
                                    new { RefId = compra.DocumentoReferenciaId.Value }, transaction: transaction);
                                
                                if (alreadyTransferred)
                                {
                                    return BadRequest(new { message = "Este documento ya ha sido transferido a otro proceso activo." });
                                }
                            }

                            // 1. Insert Header
                            // Generate Number if not provided
                            if (string.IsNullOrEmpty(compra.NumeroCompra) || compra.NumeroCompra == "(Auto)")
                            {
                                string seqCode = "PURCHASE_ORDER"; // Default
                                if (compra.TipoDocumento == "Recepcion") seqCode = "GOODS_RECEIPT";

                                var seqSql = "SELECT TOP 1 * FROM DocumentSequences WHERE Code = @Code";
                                var seqDoc = await connection.QueryFirstOrDefaultAsync<DocumentSequence>(seqSql, new { Code = seqCode }, transaction: transaction);

                                if (seqDoc == null)
                                {
                                    // Fallback seed
                                    string name = seqCode == "PURCHASE_ORDER" ? "Orden de Compra" : "Recepción de Mercancía";
                                    string prefix = seqCode == "PURCHASE_ORDER" ? "OC-" : "REC-";
                                    await connection.ExecuteAsync(
                                        "INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length) VALUES (@Code, @Name, @Prefix, 0, 6)",
                                        new { Code = seqCode, Name = name, Prefix = prefix }, transaction: transaction);
                                     seqDoc = await connection.QueryFirstOrDefaultAsync<DocumentSequence>(seqSql, new { Code = seqCode }, transaction: transaction);
                                }

                                int nextVal = seqDoc.CurrentValue + 1;
                                compra.NumeroCompra = $"{seqDoc.Prefix}{nextVal.ToString().PadLeft(seqDoc.Length, '0')}";

                                // Update Sequence
                                await connection.ExecuteAsync(
                                     "UPDATE DocumentSequences SET CurrentValue = @Val WHERE Id = @Id",
                                     new { Val = nextVal, Id = seqDoc.Id }, transaction: transaction);
                            }

                            // Insertar Maestro
                            var sqlHeader = @"
                                INSERT INTO ComprasMaster (
                                    NumeroCompra, ProveedorId, FechaCompra, 
                                    Estado, TerminosPago, ReferenciaProveedor, 
                                    Subtotal, Impuestos, Total, Saldo, Observaciones,
                                    FechaCreacion, UsuarioCreacion, AlmacenId,
                                    MonedaId, TasaCambio,
                                    TipoDocumento, DocumentoReferenciaId
                                ) VALUES (
                                    @NumeroCompra, @ProveedorId, @FechaCompra, 
                                    @Estado, @TerminosPago, @ReferenciaProveedor, 
                                    @Subtotal, @Impuestos, @Total, @Saldo, @Observaciones,
                                    GETDATE(), 'Usuario', @AlmacenId,
                                    @MonedaId, @TasaCambio,
                                    @TipoDocumento, @DocumentoReferenciaId
                                );
                                SELECT CAST(SCOPE_IDENTITY() as int);";

                            compra.Estado = "Completado"; // Default status
                            if (string.IsNullOrEmpty(compra.TipoDocumento)) compra.TipoDocumento = "Factura";
                            
                            // Initialize Saldo for new invoices
                            if (compra.TipoDocumento == "Factura")
                            {
                                compra.Saldo = compra.Total;
                            }
                            else
                            {
                                compra.Saldo = 0;
                            }
                            
                            int compraId = await connection.QuerySingleAsync<int>(sqlHeader, compra, transaction: transaction);

                            // Determine if we should move inventory
                            bool shouldMoveStock = false;
                            string tipoMovimiento = "Entrada";

                            if (compra.TipoDocumento == "Recepcion") shouldMoveStock = true;
                            else if (compra.TipoDocumento == "Factura" && compra.DocumentoReferenciaId == null) shouldMoveStock = true;

                            // 2. Update Reference Document Status
                            if (compra.DocumentoReferenciaId.HasValue)
                            {
                                string newStatusForRef = "Cerrado"; // Default
                                if (compra.TipoDocumento == "Recepcion") newStatusForRef = "Recibido";
                                else if (compra.TipoDocumento == "Factura") newStatusForRef = "Facturado";

                                await connection.ExecuteAsync(
                                    "UPDATE ComprasMaster SET Estado = @NewStatus WHERE Id = @RefId", 
                                    new { NewStatus = newStatusForRef, RefId = compra.DocumentoReferenciaId.Value }, transaction: transaction);
                            }

                            // Insertar Detalle
                            var sqlDetail = @"
                                INSERT INTO ComprasDetalle (
                                    CompraId, ArticuloId, NumeroArticulo, Descripcion, 
                                    Cantidad, UnidadMedida, CostoUnitario, 
                                    PorcentajeImpuesto, MontoImpuesto, TotalLinea, AlmacenId, PlanMedida, CantTotal
                                ) VALUES (
                                    @CompraId, @ArticuloId, @NumeroArticulo, @Descripcion, 
                                    @Cantidad, @UnidadMedida, @CostoUnitario, 
                                    @PorcentajeImpuesto, @MontoImpuesto, @TotalLinea, @AlmacenId, @PlanMedida, @CantTotal
                                )";

                            if (compra.Detalles != null)
                            {
                                foreach (var det in compra.Detalles)
                                {
                                    det.CompraId = compraId;
                                    if (string.IsNullOrEmpty(det.AlmacenId) && compra.AlmacenId.HasValue) 
                                    {
                                        det.AlmacenId = compra.AlmacenId.Value.ToString();
                                    }

                                    // Pre-Calculate Factor and CantTotal for all items (User Request)
                                    // We need to fetch article info regardless of shouldMoveStock to ensure CantTotal is correct?
                                    // User wants CantTotal in DB.
                                    
                                    var articuloInfo = await connection.QuerySingleAsync<dynamic>(
                                            "SELECT StockActual, CostoUnitario, PlanMedida, UnidadMedida FROM ArticulosMaster WHERE Id = @Id", 
                                            new { Id = det.ArticuloId }, transaction: transaction);
                                    
                                    string planMedida = !string.IsNullOrEmpty(det.PlanMedida) ? det.PlanMedida : (string)articuloInfo.PlanMedida;
                                    string baseUnit = (string)articuloInfo.UnidadMedida;
                                    decimal factor = 1;

                                    if (!string.IsNullOrEmpty(planMedida) && det.UnidadMedida != baseUnit)
                                    {
                                        var conversion = await connection.QuerySingleOrDefaultAsync<decimal?>(
                                                "SELECT Cantidad FROM UnidadMedidaPlanDetalle WHERE PlanId = @PlanId AND UnidadMedida = @UoM",
                                                new { PlanId = planMedida, UoM = det.UnidadMedida }, transaction: transaction);
                                            
                                        if (conversion.HasValue) factor = conversion.Value;
                                    }

                                    if (det.CantTotal.HasValue && det.CantTotal.Value > 0)
                                    {
                                        // Use value sent from frontend (User Request)
                                    }
                                    else
                                    {
                                        det.CantTotal = det.Cantidad * factor;
                                    }

                                    await connection.ExecuteAsync(sqlDetail, det, transaction: transaction);
                                    
                                    if (shouldMoveStock)
                                    {
                                        // 3. Update Stock & Kardex
                                        // Re-use logic
                                        decimal currentStock = (decimal)articuloInfo.StockActual;
                                        decimal currentCost = (decimal)articuloInfo.CostoUnitario;
                                        // factor already calculated
                                        // baseUnit already fetched

                                        // ... existing logic ...


                                        decimal actualQtyToAdd = det.CantTotal.Value;
                                        decimal newStock = currentStock + actualQtyToAdd;
                                        decimal newCost = currentCost;

                                        decimal costPerBaseUnit = det.CostoUnitario / factor;

                                        if (newStock > 0)
                                        {
                                            newCost = ((currentStock * currentCost) + (actualQtyToAdd * costPerBaseUnit)) / newStock;
                                        }

                                        // Update Article (Stock + Cost)
                                        await connection.ExecuteAsync(
                                            "UPDATE ArticulosMaster SET StockActual = @NewStock, CostoUnitario = @NewCost WHERE Id = @Id",
                                            new { NewStock = newStock, NewCost = newCost, Id = det.ArticuloId }, transaction: transaction);

                                        // Insert Movement (Kardex)
                                        var sqlKardex = @"
                                            INSERT INTO MovimientosInventario (
                                                ArticuloId, FechaMovimiento, TipoMovimiento, 
                                                Cantidad, CostoUnitario, Referencia, 
                                                Usuario, AlmacenId, StockAnterior, StockNuevo, UnidadMedida, CantidadOriginal, UnidadOriginal, CantAdq
                                            ) VALUES (
                                                @ArticuloId, GETDATE(), @TipoMovimiento, 
                                                @Cantidad, @CostoUnitario, @Referencia, 
                                                'Sistema', @AlmacenId, @StockAnterior, @StockNuevo, @UnidadMedida, @CantidadOriginal, @UnidadOriginal, @CantAdq
                                            )";

                                        await connection.ExecuteAsync(sqlKardex, new {
                                            ArticuloId = det.ArticuloId,
                                            TipoMovimiento = tipoMovimiento,
                                            Cantidad = actualQtyToAdd, 
                                            CostoUnitario = costPerBaseUnit, 
                                            Referencia = compra.NumeroCompra,
                                            AlmacenId = det.AlmacenId != null ? int.Parse(det.AlmacenId) : (compra.AlmacenId ?? 1), 
                                            StockAnterior = currentStock,
                                            StockNuevo = newStock,
                                            UnidadMedida = baseUnit, 
                                            CantidadOriginal = det.Cantidad,
                                            UnidadOriginal = det.UnidadMedida,
                                            CantAdq = det.Cantidad // User Request: "cantidad digitada" goes to "Cant Adq"
                                        }, transaction: transaction);
                                    }
                                }
                            }

                            transaction.Commit();

                            // Audit Log
                            await AuditHelper.LogAsync(connection, null, "ComprasMaster", compraId.ToString(), "INSERT", null, compra, "Usuario");

                            return Ok(new { message = "Compra guardada exitosamente", id = compraId, numero = compra.NumeroCompra });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw ex;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear compra", error = ex.Message });
            }
        }

        // PUT: api/Compras/{id}/anular
        [HttpPut("{id}/anular")]
        public async Task<IActionResult> AnularCompra(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 1. Get Purchase to ensure it exists and is not already annulled
                            var compra = await connection.QuerySingleOrDefaultAsync<dynamic>(
                                "SELECT id, NumeroCompra, Estado, AlmacenId FROM ComprasMaster WHERE id = @Id", 
                                new { Id = id }, transaction: transaction);

                            if (compra == null) return NotFound(new { message = "Compra no encontrada" });
                            if (compra.Estado == "Anulado") return BadRequest(new { message = "La compra ya está anulada" });

                            // 2. Get Details to reverse stock
                            var detalles = await connection.QueryAsync<dynamic>(
                                "SELECT * FROM ComprasDetalle WHERE CompraId = @Id", 
                                new { Id = id }, transaction: transaction);

                            foreach (var det in detalles)
                            {
                                // Get current article info
                                var articuloInfo = await connection.QuerySingleAsync<dynamic>(
                                    "SELECT StockActual, CostoUnitario, PlanMedida, UnidadMedida FROM ArticulosMaster WHERE Id = @Id", 
                                    new { Id = det.ArticuloId }, transaction: transaction);
                                
                                decimal currentStock = (decimal)articuloInfo.StockActual;
                                decimal currentCost = (decimal)articuloInfo.CostoUnitario;
                                string planMedida = det.PlanMedida;
                                string baseUnit = (string)articuloInfo.UnidadMedida;

                                // Get Factor
                                decimal factor = 1;
                                if (!string.IsNullOrEmpty(planMedida) && det.UnidadMedida != baseUnit)
                                {
                                    var conversion = await connection.QuerySingleOrDefaultAsync<decimal?>(
                                        "SELECT Cantidad FROM UnidadMedidaPlanDetalle WHERE PlanId = @PlanId AND UnidadMedida = @UoM",
                                        new { PlanId = planMedida, UoM = det.UnidadMedida }, transaction: transaction);
                                    
                                    if (conversion.HasValue) factor = conversion.Value;
                                }

                                decimal qtyToRemove = det.Cantidad * factor;
                                decimal costPerBase = det.CostoUnitario / factor;
                                decimal newStock = currentStock - qtyToRemove;
                                
                                // Simple cost maintenance for annulment
                                await connection.ExecuteAsync(
                                    "UPDATE ArticulosMaster SET StockActual = @NewStock WHERE Id = @Id",
                                    new { NewStock = newStock, Id = det.ArticuloId }, transaction: transaction);

                                // 3. Register Kardex Salida (Anullation)
                                var sqlKardex = @"
                                    INSERT INTO MovimientosInventario (
                                        ArticuloId, FechaMovimiento, TipoMovimiento, 
                                        Cantidad, CostoUnitario, Referencia, 
                                        Usuario, AlmacenId, StockAnterior, StockNuevo, UnidadMedida, CantidadOriginal, UnidadOriginal
                                    ) VALUES (
                                        @ArticuloId, GETDATE(), 'Salida', 
                                        @Cantidad, @CostoUnitario, @Referencia, 
                                        'Sistema', @AlmacenId, @StockAnterior, @StockNuevo, @UnidadMedida, @CantidadOriginal, @UnidadOriginal
                                    )";

                                await connection.ExecuteAsync(sqlKardex, new {
                                    ArticuloId = det.ArticuloId,
                                    Cantidad = qtyToRemove,
                                    CostoUnitario = costPerBase,
                                    Referencia = compra.NumeroCompra,
                                    AlmacenId = det.AlmacenId ?? (compra.AlmacenId ?? 1),
                                    StockAnterior = currentStock,
                                    StockNuevo = newStock,
                                    UnidadMedida = baseUnit,
                                    CantidadOriginal = det.Cantidad,
                                    UnidadOriginal = det.UnidadMedida
                                }, transaction: transaction);
                            }

                            // 4. Update Header Status
                            await connection.ExecuteAsync(
                                "UPDATE ComprasMaster SET Estado = 'Anulado' WHERE id = @Id", 
                                new { Id = id }, transaction: transaction);

                            transaction.Commit();

                            // Audit Log
                            await AuditHelper.LogAsync(connection, null, "ComprasMaster", id.ToString(), "ANULACION", compra, new { Estado = "Anulado" }, "Usuario");

                            return Ok(new { message = "Compra anulada exitosamente" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw ex;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al anular compra", error = ex.Message });
            }
        }
    }

    public class CompraDto
    {
        public int Id { get; set; }
        public string? NumeroCompra { get; set; }
        public int ProveedorId { get; set; }
        public string? ProveedorNombre { get; set; } // For Display
        public string? CodigoProveedor { get; set; } // For Display
        public DateTime FechaCompra { get; set; }
        public string Estado { get; set; } = "Borrador";
        public string? TerminosPago { get; set; }
        public string? ReferenciaProveedor { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Impuestos { get; set; }
        public decimal Total { get; set; }
        public decimal Saldo { get; set; }
        public string? Observaciones { get; set; }
        public int? AlmacenId { get; set; }
        public int? MonedaId { get; set; }
        public string? MonedaCodigo { get; set; }
        public string? MonedaSimbolo { get; set; }
        public bool? MonedaEsFuncional { get; set; }
        public decimal? TasaCambio { get; set; }
        
        public string TipoDocumento { get; set; } = "Factura"; // OrdenCompra, Recepcion, Factura
        public int? DocumentoReferenciaId { get; set; } // ID of the previous step (e.g., OC ID for a Reception)
        public string? DocumentoReferenciaNumero { get; set; } // Number of the previous step
        public bool YaTransferido { get; set; } // Indicates if this document has been used as a reference

        public List<CompraDetalleDto> Detalles { get; set; } = new List<CompraDetalleDto>();
    }

    public class CompraDetalleDto
    {
        public int Id { get; set; }
        public int CompraId { get; set; }
        public int ArticuloId { get; set; }
        public string NumeroArticulo { get; set; }
        public string Descripcion { get; set; }
        public decimal Cantidad { get; set; }
        public string UnidadMedida { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal PorcentajeImpuesto { get; set; }
        public decimal MontoImpuesto { get; set; }
        public decimal TotalLinea { get; set; }
        public string? AlmacenId { get; set; }
        public string? PlanMedida { get; set; }
        public decimal? CantTotal { get; set; } // New Field
    }

    public class CompraListDto : CompraDto 
    {
        // Lightweight DTO for list view if needed, reusing CompraDto for now
    }
}
