using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Helpers;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PagosController : ControllerBase
    {
        private readonly string _connectionString;

        public PagosController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/Pagos
        [HttpGet]
        public async Task<IActionResult> GetPagos()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            p.*, 
                            prov.RazonSocial as ProveedorNombre,
                            m.Codigo as MonedaCodigo,
                            m.Simbolo as MonedaSimbolo
                        FROM PagosMaster p
                        LEFT JOIN ProveedoresMaster prov ON p.ProveedorId = prov.Id
                        LEFT JOIN Monedas m ON p.MonedaId = m.Id
                        ORDER BY p.Fecha DESC";
                    
                    var pagos = await connection.QueryAsync<PagoListDto>(sql);

                    // For each payment, get the affected invoices
                    foreach (var pago in pagos)
                    {
                        var sqlDetails = @"
                            SELECT 
                                d.CompraId as InvoiceId, 
                                c.NumeroCompra as Numero, 
                                d.MontoAplicado as Monto
                            FROM PagosDetalle d
                            JOIN ComprasMaster c ON d.CompraId = c.Id
                            WHERE d.PagoId = @PagoId";
                        
                        pago.FacturasAfectadas = (await connection.QueryAsync<FacturaAfectadaDto>(sqlDetails, new { PagoId = pago.Id })).ToList();
                    }

                    return Ok(pagos);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener pagos", error = ex.Message });
            }
        }

        // GET: api/Pagos/FacturasPendientes/{proveedorId}
        [HttpGet("FacturasPendientes/{proveedorId}")]
        public async Task<IActionResult> GetFacturasPendientes(int proveedorId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            c.Id, 
                            c.NumeroCompra as Numero, 
                            c.FechaCompra as Fecha, 
                            c.Total as Monto, 
                            c.Saldo,
                            m.Id as MonedaId,
                            m.Codigo as MonedaCodigo,
                            m.Simbolo as MonedaSimbolo,
                            c.TasaCambio as TasaFactura,
                            (SELECT RazonSocial FROM ProveedoresMaster WHERE Id = @Id) as Proveedor
                        FROM ComprasMaster c
                        LEFT JOIN Monedas m ON c.MonedaId = m.Id
                        WHERE c.ProveedorId = @Id AND c.Saldo > 0 AND c.Estado <> 'Anulado'
                        ORDER BY c.FechaCompra ASC";
                    
                    var facturas = await connection.QueryAsync<FacturaPendienteDto>(sql, new { Id = proveedorId });
                    return Ok(facturas);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener facturas pendientes", error = ex.Message });
            }
        }

        // POST: api/Pagos
        [HttpPost]
        public async Task<IActionResult> CreatePago([FromBody] PagoRegistrationDto dto)
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
                            // ACCOUNTING CONTROL: Validate functional balance
                            decimal totalFunctionalDetails = dto.Allocations.Sum(a => a.MontoFuncional);
                            // Header amount is in Payment Currency. We need his functional value.
                            decimal headerFunctional = dto.Monto;
                            if (dto.MonedaId != 1) // Assuming 1 is DOP (Functional)
                            {
                                headerFunctional = dto.Monto * dto.TasaCambio;
                            }

                            // Allow small rounding difference (0.05)
                            if (Math.Abs(headerFunctional - totalFunctionalDetails) > 0.05m)
                            {
                                return BadRequest(new { message = $"Descuadre contable detected: El total del pago (DOP {headerFunctional:N2}) no coincide con el detalle (DOP {totalFunctionalDetails:N2})" });
                            }

                            var sqlHeader = @"
                                INSERT INTO PagosMaster (
                                    ProveedorId, Fecha, Metodo, Monto, 
                                    Referencia, Estado, Nota, Usuario,
                                    MonedaId, TasaCambio
                                ) VALUES (
                                    @ProveedorId, @Fecha, @Metodo, @Monto, 
                                    'PENDIENTE', 'Pendiente', @Nota, 'Sistema',
                                    @MonedaId, @TasaCambio
                                );
                                SELECT CAST(SCOPE_IDENTITY() as int);";

                            int pagoId = await connection.QuerySingleAsync<int>(sqlHeader, dto, transaction: transaction);

                            var sqlDetail = @"
                                INSERT INTO PagosDetalle (PagoId, CompraId, MontoAplicado, MontoAplicadoFuncional, DiferenciaCambiaria)
                                VALUES (@PagoId, @CompraId, @MontoAplicado, @MontoAplicadoFuncional, @DiferenciaCambiaria)";

                            foreach (var allocation in dto.Allocations)
                            {
                                // Accounting Calculation:
                                // Value in DOP at Invoice Time = Monto * TasaFactura
                                // Value in DOP at Payment Time = MontoFuncional (calculated in frontend based on Payment Tasa)
                                // Difference = PaymentTimeDOP - InvoiceTimeDOP
                                
                                await connection.ExecuteAsync(sqlDetail, new {
                                    PagoId = pagoId,
                                    CompraId = allocation.InvoiceId,
                                    MontoAplicado = allocation.Monto,
                                    MontoAplicadoFuncional = allocation.MontoFuncional,
                                    DiferenciaCambiaria = allocation.DiferenciaCambiaria
                                }, transaction: transaction);
                            }

                            transaction.Commit();

                            // Audit Log
                            await AuditHelper.LogAsync(connection, null, "PagosMaster", pagoId.ToString(), "INSERT", null, dto, "Sistema");

                            return Ok(new { message = "Pago registrado exitosamente", id = pagoId });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al registrar pago", error = ex.Message });
            }
        }

        // PUT: api/Pagos/{id}/confirmar
        [HttpPut("{id}/confirmar")]
        public async Task<IActionResult> ConfirmarPago(int id, [FromBody] PagoConfirmationDto dto)
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
                            // 1. Get Payment and details
                            var pago = await connection.QuerySingleOrDefaultAsync<dynamic>(
                                "SELECT * FROM PagosMaster WHERE Id = @Id", new { Id = id }, transaction: transaction);
                            
                            if (pago == null) return NotFound(new { message = "Pago no encontrado" });
                            if (pago.Estado != "Pendiente") return BadRequest(new { message = "El pago ya ha sido procesado" });

                            var detalles = await connection.QueryAsync<dynamic>(
                                "SELECT * FROM PagosDetalle WHERE PagoId = @Id", new { Id = id }, transaction: transaction);

                            // 2. Update Invoices Saldo
                            foreach (var det in detalles)
                            {
                                var sqlUpdateSaldo = "UPDATE ComprasMaster SET Saldo = Saldo - @Monto WHERE Id = @Id";
                                await connection.ExecuteAsync(sqlUpdateSaldo, new { Monto = det.MontoAplicado, Id = det.CompraId }, transaction: transaction);
                            }

                            // 3. Update Payment Status and Reference
                            var sqlUpdatePago = "UPDATE PagosMaster SET Estado = 'Completado', Referencia = @Referencia WHERE Id = @Id";
                            await connection.ExecuteAsync(sqlUpdatePago, new { Referencia = dto.Referencia, Id = id }, transaction: transaction);

                            transaction.Commit();

                            // Audit Log
                            await AuditHelper.LogAsync(connection, null, "PagosMaster", id.ToString(), "CONFIRMACION", pago, dto, "Sistema");

                            return Ok(new { message = "Pago confirmado exitosamente" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al confirmar pago", error = ex.Message });
            }
        }

        // PUT: api/Pagos/{id}/anular
        [HttpPut("{id}/anular")]
        public async Task<IActionResult> AnularPago(int id)
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
                            // 1. Get Payment
                            var pago = await connection.QuerySingleOrDefaultAsync<dynamic>(
                                "SELECT * FROM PagosMaster WHERE Id = @Id", new { Id = id }, transaction: transaction);
                            
                            if (pago == null) return NotFound(new { message = "Pago no encontrado" });
                            if (pago.Estado == "Anulado") return BadRequest(new { message = "El pago ya está anulado" });

                            // 2. Get Details (Affected Invoices)
                            var detalles = await connection.QueryAsync<dynamic>(
                                "SELECT * FROM PagosDetalle WHERE PagoId = @Id", new { Id = id }, transaction: transaction);

                            // 3. Restore Invoices Saldo (Reverse the payment)
                            foreach (var det in detalles)
                            {
                                var sqlUpdateSaldo = "UPDATE ComprasMaster SET Saldo = Saldo + @Monto WHERE Id = @Id";
                                await connection.ExecuteAsync(sqlUpdateSaldo, new { Monto = det.MontoAplicado, Id = det.CompraId }, transaction: transaction);
                            }

                            // 4. Update Payment Status
                            var sqlUpdatePago = "UPDATE PagosMaster SET Estado = 'Anulado' WHERE Id = @Id";
                            await connection.ExecuteAsync(sqlUpdatePago, new { Id = id }, transaction: transaction);

                            transaction.Commit();

                            // Audit Log
                            await AuditHelper.LogAsync(connection, null, "PagosMaster", id.ToString(), "ANULACION", pago, new { Estado = "Anulado" }, "Sistema");

                            return Ok(new { message = "Pago anulado exitosamente" });
                        }
                        catch (Exception ex)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al anular pago", error = ex.Message });
            }
        }

        // GET: api/Pagos/DeudaTotal
        [HttpGet("DeudaTotal")]
        public async Task<IActionResult> GetDeudaTotal()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            SUM(Saldo) as TotalDeuda,
                            COUNT(Id) as CantidadFacturas,
                            (SELECT SUM(Monto) FROM PagosMaster WHERE Estado = 'Pendiente') as PagosPendientes
                        FROM ComprasMaster
                        WHERE Saldo > 0 AND Estado <> 'Anulado' AND TipoDocumento = 'Factura'";
                    
                    var result = await connection.QuerySingleOrDefaultAsync<dynamic>(sql);
                    
                    var sqlPorProveedor = @"
                        SELECT 
                            p.Id as ProveedorId,
                            p.RazonSocial as ProveedorNombre,
                            SUM(c.Saldo) as SaldoTotal
                        FROM ProveedoresMaster p
                        JOIN ComprasMaster c ON p.Id = c.ProveedorId
                        WHERE c.Saldo > 0 AND c.Estado <> 'Anulado' AND c.TipoDocumento = 'Factura'
                        GROUP BY p.Id, p.RazonSocial";
                    
                    var porProveedor = await connection.QueryAsync<dynamic>(sqlPorProveedor);

                    return Ok(new {
                        totalDeuda = result?.TotalDeuda ?? 0,
                        cantidadFacturas = result?.CantidadFacturas ?? 0,
                        pagosPendientes = result?.PagosPendientes ?? 0,
                        porProveedor = porProveedor
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener deuda total", error = ex.Message });
            }
        }
    }

    public class PagoListDto
    {
        public int Id { get; set; }
        public int ProveedorId { get; set; }
        public string ProveedorNombre { get; set; }
        public DateTime Fecha { get; set; }
        public string Metodo { get; set; }
        public decimal Monto { get; set; }
        public string Referencia { get; set; }
        public string Estado { get; set; }
        public string Nota { get; set; }
        public int? MonedaId { get; set; }
        public string MonedaCodigo { get; set; }
        public string MonedaSimbolo { get; set; }
        public decimal TasaCambio { get; set; }
        public List<FacturaAfectadaDto> FacturasAfectadas { get; set; } = new List<FacturaAfectadaDto>();
    }

    public class FacturaAfectadaDto
    {
        public int InvoiceId { get; set; }
        public string Numero { get; set; }
        public decimal Monto { get; set; }
    }

    public class FacturaPendienteDto
    {
        public int Id { get; set; }
        public string Numero { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Monto { get; set; }
        public decimal Saldo { get; set; }
        public int? MonedaId { get; set; }
        public string MonedaCodigo { get; set; }
        public string MonedaSimbolo { get; set; }
        public decimal TasaFactura { get; set; }
        public string Proveedor { get; set; }
    }

    public class PagoRegistrationDto
    {
        public int ProveedorId { get; set; }
        public DateTime Fecha { get; set; }
        public string Metodo { get; set; }
        public decimal Monto { get; set; }
        public int? MonedaId { get; set; }
        public decimal TasaCambio { get; set; }
        public string Nota { get; set; }
        public List<AllocationDto> Allocations { get; set; }
    }

    public class AllocationDto
    {
        public int InvoiceId { get; set; }
        public decimal Monto { get; set; } // Monto en la moneda de la factura
        public decimal MontoFuncional { get; set; } // Monto en DOP (funcional)
        public decimal DiferenciaCambiaria { get; set; } // Diferencia entre (Monto * TasaFactura) y MontoFuncional
    }

    public class PagoConfirmationDto
    {
        public string Referencia { get; set; }
    }
}
