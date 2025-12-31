using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CobrosController : ControllerBase
    {
        private readonly string _connectionString;

        public CobrosController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("Pendientes/{clienteId}")]
        public async Task<IActionResult> GetPendientes(int clienteId)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    v.Id, 
                    v.NumeroFactura, 
                    v.Fecha, 
                    v.FechaVencimiento,
                    v.NCF,
                    v.Total, 
                    v.Saldo, 
                    v.MonedaId,
                    m.Simbolo as MonedaSimbolo,
                    m.Codigo as MonedaCodigo,
                    v.TasaCambio
                FROM VentasMaster v
                LEFT JOIN Monedas m ON v.MonedaId = m.Id
                WHERE v.ClienteId = @ClienteId 
                AND v.Saldo > 0 
                AND v.Estado <> 'Anulado'
                ORDER BY v.Fecha";
            
            var pendientes = await db.QueryAsync(sql, new { ClienteId = clienteId });
            return Ok(pendientes);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCobro([FromBody] CobroDto cobro)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            using var tx = db.BeginTransaction();
            try
            {
                // 1. Sequence
                var seqSql = "SELECT TOP 1 * FROM DocumentSequences WHERE Code = 'PAYMENT_RECEIPT'";
                var seqDoc = await db.QueryFirstOrDefaultAsync<DocumentSequence>(seqSql, transaction: tx);
                
                // Fallback creation if missing
                if (seqDoc == null)
                {
                     await db.ExecuteAsync("INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length) VALUES ('PAYMENT_RECEIPT', 'Recibo de Ingreso', 'RC-', 0, 6)", transaction: tx);
                     seqDoc = await db.QueryFirstOrDefaultAsync<DocumentSequence>(seqSql, transaction: tx);
                }

                int nextVal = seqDoc.CurrentValue + 1;
                string docNum = $"{seqDoc.Prefix}{nextVal.ToString().PadLeft(seqDoc.Length, '0')}";
                
                await db.ExecuteAsync("UPDATE DocumentSequences SET CurrentValue = @Val WHERE Id = @Id", new { Val = nextVal, Id = seqDoc.Id }, transaction: tx);
                
                // 2. Insert Master
                var sqlMaster = @"
                    INSERT INTO CobrosMaster (
                        NumeroCobro, ClienteId, Fecha, Monto, MetodoPago, 
                        Referencia, MonedaId, TasaCambio, Observaciones, Usuario
                    ) VALUES (
                        @NumeroCobro, @ClienteId, @Fecha, @Monto, @MetodoPago, 
                        @Referencia, @MonedaId, @TasaCambio, @Observaciones, @Usuario
                    );
                    SELECT CAST(SCOPE_IDENTITY() as int)";
                
                int cobroId = await db.QuerySingleAsync<int>(sqlMaster, new {
                    NumeroCobro = docNum,
                    cobro.ClienteId,
                    cobro.Fecha,
                    cobro.Monto,
                    cobro.MetodoPago,
                    cobro.Referencia,
                    cobro.MonedaId,
                    cobro.TasaCambio,
                    cobro.Observaciones,
                    Usuario = "Sistema" // TODO: Get from claims
                }, transaction: tx);

                // 3. Process Allocations
                foreach (var det in cobro.Detalles)
                {
                    // Update Invoice Balance
                    // We need to handle Currency Conversion if Invoice Currency != Payment Currency?
                    // For MVP simplicity, assumed verified in Frontend or same currency logic validation.
                    // But typically we deduct the EQUIVALENT amount.
                    
                    // Let's assume the Frontend sends 'MontoAplicado' in the currency of the INVOICE to keep Saldo math simple.
                    // OR we check logic.
                    // Standard: Saldo is in Invoice Currency.
                    
                    await db.ExecuteAsync(@"
                        INSERT INTO CobrosDetalle (CobroId, VentaId, MontoAplicado)
                        VALUES (@CobroId, @VentaId, @MontoAplicado)", 
                        new { CobroId = cobroId, VentaId = det.VentaId, MontoAplicado = det.MontoAplicado }, transaction: tx);

                    await db.ExecuteAsync(@"
                        UPDATE VentasMaster 
                        SET Saldo = Saldo - @Monto 
                        WHERE Id = @Id", 
                        new { Monto = det.MontoAplicado, Id = det.VentaId }, transaction: tx);
                }

                tx.Commit();
                return Ok(new { message = "Cobro registrado", id = cobroId, numero = docNum });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return StatusCode(500, new { message = "Error al registrar cobro", error = ex.Message });
            }
        }
    }

    public class CobroDto
    {
        public int ClienteId { get; set; }
        public DateTime Fecha { get; set; }
        public decimal Monto { get; set; }
        public string MetodoPago { get; set; }
        public string? Referencia { get; set; }
        public int? MonedaId { get; set; }
        public decimal TasaCambio { get; set; }
        public string? Observaciones { get; set; }
        public List<CobroDetalleDto> Detalles { get; set; } = new List<CobroDetalleDto>();
    }

    public class CobroDetalleDto
    {
        public int VentaId { get; set; }
        public decimal MontoAplicado { get; set; }
    }
}
