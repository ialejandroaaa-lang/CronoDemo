using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PosCrono.API.Models;
using PosCrono.API.Dtos;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CreditNotesController : ControllerBase
    {
        private readonly string _connectionString;

        public CreditNotesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("ByClient/{clientId}")]
        public async Task<IActionResult> GetByClient(int clientId)
        {
            using var db = new SqlConnection(_connectionString);
            var sql = "SELECT * FROM CreditNotes WHERE ClienteId = @ClientId AND Saldo > 0 AND Estado = 'Activo'";
            var notes = await db.QueryAsync<CreditNote>(sql, new { ClientId = clientId });
            return Ok(notes);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> Create([FromBody] CreditNoteDto dto)
        {
            using var db = new SqlConnection(_connectionString);
            await db.OpenAsync();
            using var tx = db.BeginTransaction();
            try
            {
                 // 1. Get NCF Sequence
                var seq = await db.QueryFirstOrDefaultAsync<dynamic>("SELECT * FROM NCF_Secuencias WHERE TipoNCF = '04' AND Activo = 1", transaction: tx);
                if (seq == null) return BadRequest("No existe secuencia de NCF para Nota de Crédito (Tipo 04).");

                int nextVal = seq.Actual + 1;
                string ncf = seq.Prefijo + nextVal.ToString("D8");
                await db.ExecuteAsync("UPDATE NCF_Secuencias SET Actual = @Actual WHERE Id = @Id", new { Actual = nextVal, Id = seq.Id }, transaction: tx);

                // 2. Create
                 var sqlCN = @"
                INSERT INTO CreditNotes (ClienteId, VentaOrigenId, ReturnId, NCF, Monto, Saldo, Fecha, Usuario, Estado, Concepto)
                VALUES (@ClienteId, @VentaId, @ReturnId, @NCF, @Monto, @Monto, GETDATE(), 'System', 'Activo', @Concepto);
                SELECT CAST(SCOPE_IDENTITY() as int)";

                var id = await db.QuerySingleAsync<int>(sqlCN, new {
                    dto.ClienteId,
                    VentaId = dto.VentaOrigenId,
                    dto.ReturnId,
                    NCF = ncf,
                    dto.Monto,
                    Concepto = dto.Concepto ?? "Nota de Crédito Manual"
                }, transaction: tx);

                tx.Commit();
                return Ok(new { Id = id, NCF = ncf });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return StatusCode(500, ex.Message);
            }
        }
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            using var db = new SqlConnection(_connectionString);
            
            // Adjust end date to capture full day
            DateTime? endAdjusted = end.HasValue ? end.Value.Date.AddDays(1) : (DateTime?)null;

            var sql = @"
                SELECT cn.*, c.Name as ClienteNombre, v.NumeroFactura
                FROM CreditNotes cn
                JOIN Clients c ON cn.ClienteId = c.Id
                LEFT JOIN VentasMaster v ON cn.VentaOrigenId = v.Id
                WHERE (@Start IS NULL OR cn.Fecha >= @Start) 
                  AND (@End IS NULL OR cn.Fecha < @End)
                ORDER BY cn.Fecha DESC";

            var list = await db.QueryAsync<dynamic>(sql, new { Start = start, End = endAdjusted });
            return Ok(list);
        }
    }
}
