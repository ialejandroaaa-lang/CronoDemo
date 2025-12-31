using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Data;

namespace PosCrono.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UnidadMedidaController : ControllerBase
    {
        private readonly string _connectionString;

        public UnidadMedidaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        }

        // GET: api/UnidadMedida/Planes
        [HttpGet("Planes")]
        public async Task<IActionResult> GetPlanes()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var planes = await connection.QueryAsync<UnidadMedidaPlanDto>(@"
                    SELECT Id, PlanId, Descripcion, UnidadBase, Decimales, FechaCreacion
                    FROM UnidadMedidaPlan
                    ORDER BY PlanId");

                foreach (var plan in planes)
                {
                    var detalles = await connection.QueryAsync<UnidadMedidaPlanDetalleDto>(@"
                        SELECT Id, PlanId, UnidadMedida, Cantidad, Equivalente, Orden
                        FROM UnidadMedidaPlanDetalle
                        WHERE PlanId = @PlanId
                        ORDER BY Orden", new { PlanId = plan.PlanId });
                    plan.Detalles = detalles.ToList();
                }
                
                return Ok(planes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving UoM Plans", error = ex.Message });
            }
        }

        // GET: api/UnidadMedida/Planes/{planId}
        [HttpGet("Planes/{planId}")]
        public async Task<IActionResult> GetPlan(string planId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                
                var plan = await connection.QueryFirstOrDefaultAsync<UnidadMedidaPlanDto>(@"
                    SELECT Id, PlanId, Descripcion, UnidadBase, Decimales, FechaCreacion
                    FROM UnidadMedidaPlan WHERE PlanId = @PlanId", new { PlanId = planId });

                if (plan == null) return NotFound(new { message = "Plan not found" });

                var detalles = await connection.QueryAsync<UnidadMedidaPlanDetalleDto>(@"
                    SELECT Id, PlanId, UnidadMedida, Cantidad, Equivalente, Orden
                    FROM UnidadMedidaPlanDetalle
                    WHERE PlanId = @PlanId
                    ORDER BY Orden, Cantidad", new { PlanId = planId });

                plan.Detalles = detalles.ToList();

                return Ok(plan);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving UoM Plan", error = ex.Message });
            }
        }

        // POST: api/UnidadMedida/Planes
        [HttpPost("Planes")]
        public async Task<IActionResult> SavePlan([FromBody] UnidadMedidaPlanDto planDto)
        {
            if (string.IsNullOrEmpty(planDto.PlanId))
                return BadRequest(new { message = "Plan ID is required" });

            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // 1. Upsert Plan Header
                    var exists = await connection.ExecuteScalarAsync<int>(
                        "SELECT COUNT(1) FROM UnidadMedidaPlan WHERE PlanId = @PlanId",
                        new { PlanId = planDto.PlanId }, transaction);

                    if (exists > 0)
                    {
                        await connection.ExecuteAsync(@"
                            UPDATE UnidadMedidaPlan 
                            SET Descripcion = @Descripcion, 
                                UnidadBase = @UnidadBase, 
                                Decimales = @Decimales,
                                FechaModificacion = GETDATE()
                            WHERE PlanId = @PlanId", planDto, transaction);
                    }
                    else
                    {
                        await connection.ExecuteAsync(@"
                            INSERT INTO UnidadMedidaPlan (PlanId, Descripcion, UnidadBase, Decimales)
                            VALUES (@PlanId, @Descripcion, @UnidadBase, @Decimales)", planDto, transaction);
                    }

                    // 2. Clear existing details
                    await connection.ExecuteAsync(
                        "DELETE FROM UnidadMedidaPlanDetalle WHERE PlanId = @PlanId",
                        new { PlanId = planDto.PlanId }, transaction);

                    // 3. Insert new details
                    if (planDto.Detalles != null && planDto.Detalles.Any())
                    {
                        foreach (var det in planDto.Detalles)
                        {
                            det.PlanId = planDto.PlanId; // Ensure FK integrity
                            await connection.ExecuteAsync(@"
                                INSERT INTO UnidadMedidaPlanDetalle (PlanId, UnidadMedida, Cantidad, Equivalente, Orden)
                                VALUES (@PlanId, @UnidadMedida, @Cantidad, @Equivalente, @Orden)",
                                det, transaction);
                        }
                    }

                    transaction.Commit();
                    return Ok(new { message = "UoM Plan saved successfully" });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving UoM Plan", error = ex.Message });
            }
        }

        // DELETE: api/UnidadMedida/Planes/{planId}
        [HttpDelete("Planes/{planId}")]
        public async Task<IActionResult> DeletePlan(string planId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var rows = await connection.ExecuteAsync(
                    "DELETE FROM UnidadMedidaPlan WHERE PlanId = @PlanId",
                    new { PlanId = planId });

                if (rows > 0)
                    return Ok(new { message = "Plan deleted successfully" });
                else
                    return NotFound(new { message = "Plan not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error deleting UoM Plan", error = ex.Message });
            }
        }
    }

    public class UnidadMedidaPlanDto
    {
        public int Id { get; set; }
        public string PlanId { get; set; } = "";
        public string Descripcion { get; set; } = "";
        public string UnidadBase { get; set; } = "UND";
        public int Decimales { get; set; }
        public DateTime FechaCreacion { get; set; }
        public List<UnidadMedidaPlanDetalleDto> Detalles { get; set; } = new();
    }

    public class UnidadMedidaPlanDetalleDto
    {
        public int Id { get; set; }
        public string PlanId { get; set; } = "";
        public string UnidadMedida { get; set; } = "";
        public decimal Cantidad { get; set; }
        public string Equivalente { get; set; } = "";
        public int Orden { get; set; }
    }
}
