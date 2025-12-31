using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotasController : ControllerBase
    {
        private readonly string _connectionString;

        public NotasController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpPost]
        public async Task<IActionResult> CreateNota([FromBody] NotaDto dto)
        {
            if (dto == null) return BadRequest(new { message = "Datos de nota inválidos" });
            if (dto.Monto <= 0) return BadRequest(new { message = "El monto debe ser mayor a cero" });

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    using (var transaction = connection.BeginTransaction())
                    {
                        try
                        {
                            // 1. Insert Master
                            var sqlMaster = @"
                                INSERT INTO NotasMaster (
                                    ProveedorId, Tipo, MonedaId, TasaCambio, 
                                    Monto, MontoFuncional, Referencia, Comentario, Estado
                                ) VALUES (
                                    @ProveedorId, @Tipo, @MonedaId, @TasaCambio, 
                                    @Monto, @MontoFuncional, @Referencia, @Comentario, 'Completada'
                                );
                                SELECT CAST(SCOPE_IDENTITY() as int);";

                            var notaId = await connection.QuerySingleAsync<int>(sqlMaster, new {
                                dto.ProveedorId,
                                dto.Tipo,
                                dto.MonedaId,
                                dto.TasaCambio,
                                dto.Monto,
                                MontoFuncional = dto.Monto * dto.TasaCambio,
                                dto.Referencia,
                                dto.Comentario
                            }, transaction: transaction);

                            // 2. Insert Details and Update Invoices
                            foreach (var allocation in dto.Allocations)
                            {
                                var sqlDetail = @"
                                    INSERT INTO NotasDetalle (
                                        NotaId, CompraId, MontoAplicado, MontoAplicadoFuncional
                                    ) VALUES (
                                        @NotaId, @CompraId, @MontoAplicado, @MontoAplicadoFuncional
                                    )";

                                await connection.ExecuteAsync(sqlDetail, new {
                                    NotaId = notaId,
                                    CompraId = allocation.InvoiceId,
                                    MontoAplicado = allocation.Monto,
                                    MontoAplicadoFuncional = allocation.MontoFuncional
                                }, transaction: transaction);

                                // Update Invoice Balance
                                string sqlUpdateSaldo;
                                if (dto.Tipo == "Credito")
                                {
                                    // Credit Note reduces what we owe
                                    sqlUpdateSaldo = "UPDATE ComprasMaster SET Saldo = Saldo - @Monto WHERE Id = @Id";
                                }
                                else // Debito
                                {
                                    // Debit Note increases what we owe
                                    sqlUpdateSaldo = "UPDATE ComprasMaster SET Saldo = Saldo + @Monto WHERE Id = @Id";
                                }

                                await connection.ExecuteAsync(sqlUpdateSaldo, new { 
                                    Monto = allocation.Monto, 
                                    Id = allocation.InvoiceId 
                                }, transaction: transaction);
                            }

                            transaction.Commit();
                            return Ok(new { message = "Nota registrada exitosamente", id = notaId });
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
                return StatusCode(500, new { message = "Error al registrar nota", error = ex.Message });
            }
        }

        [HttpGet("proveedor/{proveedorId}")]
        public async Task<IActionResult> GetNotasByProveedor(int proveedorId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT n.*, m.Simbolo as MonedaSimbolo 
                        FROM NotasMaster n
                        JOIN Monedas m ON n.MonedaId = m.Id
                        WHERE ProveedorId = @ProveedorId 
                        ORDER BY Fecha DESC";
                    
                    var notas = await connection.QueryAsync<dynamic>(sql, new { ProveedorId = proveedorId });
                    return Ok(notas);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener notas", error = ex.Message });
            }
        }

        [HttpPut("{id}/anular")]
        public async Task<IActionResult> AnularNota(int id)
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
                            // 1. Get Note
                            var nota = await connection.QuerySingleOrDefaultAsync<dynamic>(
                                "SELECT * FROM NotasMaster WHERE Id = @Id", new { Id = id }, transaction: transaction);
                            
                            if (nota == null) return NotFound(new { message = "Nota no encontrada" });
                            if (nota.Estado == "Anulada") return BadRequest(new { message = "La nota ya está anulada" });

                            // 2. Get Details
                            var detalles = await connection.QueryAsync<dynamic>(
                                "SELECT * FROM NotasDetalle WHERE NotaId = @Id", new { Id = id }, transaction: transaction);

                            // 3. Reverse Invoice Balances
                            foreach (var det in detalles)
                            {
                                string sqlReverse;
                                if (nota.Tipo == "Credito")
                                {
                                    sqlReverse = "UPDATE ComprasMaster SET Saldo = Saldo + @Monto WHERE Id = @Id";
                                }
                                else // Debito
                                {
                                    sqlReverse = "UPDATE ComprasMaster SET Saldo = Saldo - @Monto WHERE Id = @Id";
                                }
                                await connection.ExecuteAsync(sqlReverse, new { Monto = det.MontoAplicado, Id = det.CompraId }, transaction: transaction);
                            }

                            // 4. Update Status
                            await connection.ExecuteAsync("UPDATE NotasMaster SET Estado = 'Anulada' WHERE Id = @Id", new { Id = id }, transaction: transaction);

                            transaction.Commit();
                            return Ok(new { message = "Nota anulada exitosamente" });
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
                return StatusCode(500, new { message = "Error al anular nota", error = ex.Message });
            }
        }
    }

    public class NotaDto
    {
        public int ProveedorId { get; set; }
        public string Tipo { get; set; } // "Credito", "Debito"
        public int MonedaId { get; set; }
        public decimal TasaCambio { get; set; }
        public decimal Monto { get; set; }
        public string Referencia { get; set; }
        public string Comentario { get; set; }
        public List<NotaAllocationDto> Allocations { get; set; } = new List<NotaAllocationDto>();
    }

    public class NotaAllocationDto
    {
        public int InvoiceId { get; set; }
        public decimal Monto { get; set; }
        public decimal MontoFuncional { get; set; }
    }
}
