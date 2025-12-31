using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CotizacionesController : ControllerBase
    {
        private readonly string _connectionString;

        public CotizacionesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            using var db = new SqlConnection(_connectionString);
            var sql = @"
                SELECT 
                    c.*, 
                    cli.Name as ClienteNombre
                FROM CotizacionesMaster c
                LEFT JOIN Clients cli ON c.ClienteId = cli.Id
                ORDER BY c.Fecha DESC";
            var result = await db.QueryAsync(sql);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                using var db = new SqlConnection(_connectionString);
                var sqlMaster = @"
                    SELECT 
                        c.*, 
                        cli.Name as ClienteNombre
                    FROM CotizacionesMaster c
                    LEFT JOIN Clients cli ON c.ClienteId = cli.Id
                    WHERE c.Id = @Id";
    
                var master = await db.QueryFirstOrDefaultAsync(sqlMaster, new { Id = id });
    
                if (master == null) return NotFound();
    
                var sqlDetails = @"
                    SELECT 
                        d.*,
                        p.Descripcion as ArticuloDescripcion,
                        p.NumeroArticulo as ArticuloCodigo
                    FROM CotizacionesDetalle d
                    LEFT JOIN ArticulosMaster p ON d.ArticuloId = p.Id
                    WHERE d.CotizacionId = @Id";
    
                var details = await db.QueryAsync(sqlDetails, new { Id = id });
    
                return Ok(new { Header = master, Details = details });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cotizaciones Error] GetById failed: {ex}");
                return StatusCode(500, new { message = "Error al obtener cotización", error = ex.ToString() });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CotizacionDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            using var tx = db.BeginTransaction();
            try
            {
                // 1. Generate Quote Number
                var configSql = "SELECT TOP 1 * FROM DocumentSequences WHERE Code = 'QUOTATION'";
                var seqDoc = await db.QueryFirstOrDefaultAsync<DocumentSequence>(configSql, transaction: tx);

                if (seqDoc == null)
                {
                     await db.ExecuteAsync(
                        "INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length) VALUES ('QUOTATION', 'Cotización', 'COT-', 0, 6)", 
                        transaction: tx);
                    seqDoc = await db.QueryFirstOrDefaultAsync<DocumentSequence>(configSql, transaction: tx);
                }

                int nextSeq = seqDoc.CurrentValue + 1;
                var quoteNumber = $"{seqDoc.Prefix}{nextSeq.ToString().PadLeft(seqDoc.Length, '0')}";

                // Update Sequence
                await db.ExecuteAsync("UPDATE DocumentSequences SET CurrentValue = @Val WHERE Id = @Id", new { Val = nextSeq, Id = seqDoc.Id }, transaction: tx);

                // 2. Insert Master
                var sqlMaster = @"
                    INSERT INTO CotizacionesMaster (NumeroCotizacion, Fecha, ClienteId, AlmacenId, Usuario, Subtotal, ITBIS, Descuento, Total, MonedaId, TasaCambio, Referencia, TerminosPago, Estado, FechaVencimiento)
                    VALUES (@Numero, @Fecha, @ClienteId, @AlmacenId, @Usuario, @Subtotal, @ITBIS, @Descuento, @Total, @MonedaId, @TasaCambio, @Referencia, @TerminosPago, 'Pendiente', DATEADD(day, 15, @Fecha));
                    SELECT CAST(SCOPE_IDENTITY() as int);";

                var masterId = await db.QuerySingleAsync<int>(sqlMaster, new {
                    Numero = quoteNumber,
                    dto.Fecha,
                    dto.ClienteId,
                    dto.AlmacenId,
                    dto.Usuario,
                    dto.Subtotal,
                    dto.ITBIS,
                    Descuento = dto.DescuentoMonto, // Overall discount if any
                    dto.Total,
                    dto.MonedaId,
                    dto.TasaCambio,
                    dto.Referencia,
                    dto.TerminosPago
                }, transaction: tx);

                // 3. Insert Details
                var sqlDetail = @"
                    INSERT INTO CotizacionesDetalle (CotizacionId, ArticuloId, Cantidad, PrecioUnitario, ITBIS, DescuentoMonto, TotalLinea, UnidadMedidaId, AlmacenId)
                    VALUES (@CotizacionId, @ArticuloId, @Cantidad, @PrecioUnitario, @ITBIS, @DescuentoMonto, @TotalLinea, @UnidadMedidaId, @AlmacenId)";

                foreach (var det in dto.Detalles)
                {
                    await db.ExecuteAsync(sqlDetail, new {
                        CotizacionId = masterId,
                        det.ArticuloId,
                        det.Cantidad,
                        det.PrecioUnitario,
                        det.ITBIS,
                        det.DescuentoMonto,
                        det.TotalLinea,
                        det.UnidadMedidaId,
                        det.AlmacenId
                    }, transaction: tx);
                }

                tx.Commit();
                return Ok(new { Id = masterId, Numero = quoteNumber });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                Console.WriteLine(ex.Message);
                return StatusCode(500, "Error creating quotation: " + ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CotizacionDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            using var tx = db.BeginTransaction();
            try
            {
                // 1. Verify existence
                var existing = await db.QueryFirstOrDefaultAsync<int?>("SELECT Id FROM CotizacionesMaster WHERE Id = @Id", new { Id = id }, transaction: tx);
                if (existing == null) return NotFound(new { message = "Cotización no encontrada" });

                // 2. Update Master
                var sqlMaster = @"
                    UPDATE CotizacionesMaster SET 
                        Fecha = @Fecha, 
                        ClienteId = @ClienteId, 
                        AlmacenId = @AlmacenId, 
                        Usuario = @Usuario, 
                        Subtotal = @Subtotal, 
                        ITBIS = @ITBIS, 
                        Descuento = @Descuento, 
                        Total = @Total, 
                        MonedaId = @MonedaId, 
                        TasaCambio = @TasaCambio, 
                        Referencia = @Referencia, 
                        TerminosPago = @TerminosPago,
                        FechaVencimiento = DATEADD(day, 15, @Fecha)
                    WHERE Id = @Id";

                await db.ExecuteAsync(sqlMaster, new {
                    Id = id,
                    dto.Fecha,
                    dto.ClienteId,
                    dto.AlmacenId,
                    dto.Usuario,
                    dto.Subtotal,
                    dto.ITBIS,
                    Descuento = dto.DescuentoMonto,
                    dto.Total,
                    dto.MonedaId,
                    dto.TasaCambio,
                    dto.Referencia,
                    dto.TerminosPago
                }, transaction: tx);

                // 3. Update Details (Delete All + Insert New)
                // Pro: Simpler logic. Con: Lose historical trace of line items if strict audit needed. For Quotations, usually fine.
                await db.ExecuteAsync("DELETE FROM CotizacionesDetalle WHERE CotizacionId = @Id", new { Id = id }, transaction: tx);

                var sqlDetail = @"
                    INSERT INTO CotizacionesDetalle (CotizacionId, ArticuloId, Cantidad, PrecioUnitario, ITBIS, DescuentoMonto, TotalLinea, UnidadMedidaId, AlmacenId)
                    VALUES (@CotizacionId, @ArticuloId, @Cantidad, @PrecioUnitario, @ITBIS, @DescuentoMonto, @TotalLinea, @UnidadMedidaId, @AlmacenId)";

                foreach (var det in dto.Detalles)
                {
                    await db.ExecuteAsync(sqlDetail, new {
                        CotizacionId = id,
                        det.ArticuloId,
                        det.Cantidad,
                        det.PrecioUnitario,
                        det.ITBIS,
                        det.DescuentoMonto,
                        det.TotalLinea,
                        det.UnidadMedidaId,
                        det.AlmacenId
                    }, transaction: tx);
                }

                tx.Commit();
                return Ok(new { message = "Cotización actualizada correctamente", Id = id });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                Console.WriteLine($"[Cotizaciones Error] Update failed: {ex}");
                return StatusCode(500, new { message = "Error al actualizar cotización", error = ex.Message });
            }
        }
    }

    public class CotizacionDto
    {
        public DateTime Fecha { get; set; }
        public int ClienteId { get; set; }
        public int AlmacenId { get; set; }
        public string Usuario { get; set; }
        public decimal Subtotal { get; set; }
        public decimal ITBIS { get; set; }
        public decimal DescuentoMonto { get; set; }
        public decimal Total { get; set; }
        public int? MonedaId { get; set; }
        public decimal TasaCambio { get; set; }
        public string Referencia { get; set; }
        public string TerminosPago { get; set; }
        public List<CotizacionDetalleDto> Detalles { get; set; }
    }

    public class CotizacionDetalleDto
    {
        public int ArticuloId { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal ITBIS { get; set; }
        public decimal DescuentoMonto { get; set; }
        public decimal TotalLinea { get; set; }
        public string UnidadMedidaId { get; set; }
        public int AlmacenId { get; set; }
    }
}
