using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Models;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReceiptTemplatesController : ControllerBase
    {
        private readonly string _connectionString;

        public ReceiptTemplatesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        // GET: api/ReceiptTemplates
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = "SELECT * FROM ReceiptTemplates WHERE Activo = 1 ORDER BY Nombre";
                var templates = await connection.QueryAsync<ReceiptTemplate>(sql);
                return Ok(templates);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener plantillas", error = ex.Message });
            }
        }

        // GET: api/ReceiptTemplates/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = "SELECT * FROM ReceiptTemplates WHERE Id = @Id";
                var template = await connection.QueryFirstOrDefaultAsync<ReceiptTemplate>(sql, new { Id = id });
                
                if (template == null)
                    return NotFound(new { message = "Plantilla no encontrada" });

                return Ok(template);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener plantilla", error = ex.Message });
            }
        }

        // GET: api/ReceiptTemplates/default/Venta
        [HttpGet("default/{tipoRecibo}")]
        public async Task<IActionResult> GetDefault(string tipoRecibo)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = @"SELECT TOP 1 * FROM ReceiptTemplates 
                           WHERE TipoRecibo = @TipoRecibo AND PorDefecto = 1 AND Activo = 1
                           ORDER BY FechaModificacion DESC";
                var template = await connection.QueryFirstOrDefaultAsync<ReceiptTemplate>(sql, new { TipoRecibo = tipoRecibo });
                
                if (template == null)
                    return NotFound(new { message = $"No hay plantilla por defecto para {tipoRecibo}" });

                return Ok(template);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener plantilla por defecto", error = ex.Message });
            }
        }

        // POST: api/ReceiptTemplates
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReceiptTemplate template)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                
                var sql = @"INSERT INTO ReceiptTemplates 
                           (Nombre, Descripcion, TipoRecibo, AnchoMM, PrinterName, ConfiguracionJSON, Activo, PorDefecto, Usuario)
                           VALUES (@Nombre, @Descripcion, @TipoRecibo, @AnchoMM, @PrinterName, @ConfiguracionJSON, @Activo, @PorDefecto, @Usuario);
                           SELECT CAST(SCOPE_IDENTITY() as int)";
                
                var id = await connection.QuerySingleAsync<int>(sql, template);
                template.Id = id;
                
                return CreatedAtAction(nameof(GetById), new { id }, template);
            }
            catch (Exception ex)
            {
                var fullError = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return StatusCode(500, new { message = "Error al crear plantilla", error = fullError });
            }
        }

        // PUT: api/ReceiptTemplates/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ReceiptTemplate template)
        {
            try
            {
                if (id != template.Id)
                {
                    // Allow mismatch if the body Id is 0 or unassigned, but ideally they match
                    template.Id = id; 
                }

                using var connection = new SqlConnection(_connectionString);
                
                // Validar Usuario to avoid SQL errors if null
                var usuario = string.IsNullOrEmpty(template.Usuario) ? "Sistema" : template.Usuario;

                var sql = @"UPDATE ReceiptTemplates 
                           SET Nombre = @Nombre,
                               Descripcion = @Descripcion,
                               TipoRecibo = @TipoRecibo,
                               AnchoMM = @AnchoMM,
                               PrinterName = @PrinterName,
                               ConfiguracionJSON = @ConfiguracionJSON,
                               Activo = @Activo,
                               PorDefecto = @PorDefecto,
                               FechaModificacion = GETDATE(),
                               Usuario = @Usuario
                           WHERE Id = @Id";
                
                var rowsAffected = await connection.ExecuteAsync(sql, new {
                    template.Id,
                    template.Nombre,
                    template.Descripcion,
                    template.TipoRecibo,
                    template.AnchoMM,
                    template.PrinterName,
                    template.ConfiguracionJSON,
                    template.Activo,
                    template.PorDefecto,
                    Usuario = usuario
                });
                
                if (rowsAffected == 0)
                    return NotFound(new { message = "Plantilla no encontrada para actualizar" });

                return NoContent();
            }
            catch (Exception ex)
            {
                // Log error to console for debugging
                Console.WriteLine($"❌ [ERROR] Error updating template {id}: {ex.Message}");
                if (ex.InnerException != null)
                     Console.WriteLine($"   Inner: {ex.InnerException.Message}");
                     
                var fullError = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
                return StatusCode(500, new { message = "Error al actualizar plantilla", error = fullError });
            }
        }


        // DELETE: api/ReceiptTemplates/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                
                // Soft delete - solo marcar como inactivo
                var sql = "UPDATE ReceiptTemplates SET Activo = 0 WHERE Id = @Id";
                var rowsAffected = await connection.ExecuteAsync(sql, new { Id = id });
                
                if (rowsAffected == 0)
                    return NotFound(new { message = "Plantilla no encontrada" });

                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar plantilla", error = ex.Message });
            }
        }

        // POST: api/ReceiptTemplates/5/setDefault
        [HttpPost("{id}/setDefault")]
        public async Task<IActionResult> SetAsDefault(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                using var transaction = connection.BeginTransaction();

                try
                {
                    // Obtener el tipo de recibo de la plantilla
                    var getTipoSql = "SELECT TipoRecibo FROM ReceiptTemplates WHERE Id = @Id";
                    var tipoRecibo = await connection.QueryFirstOrDefaultAsync<string>(getTipoSql, new { Id = id }, transaction);
                    
                    if (tipoRecibo == null)
                        return NotFound(new { message = "Plantilla no encontrada" });

                    // Quitar el flag de por defecto de todas las plantillas del mismo tipo
                    var clearDefaultSql = "UPDATE ReceiptTemplates SET PorDefecto = 0 WHERE TipoRecibo = @TipoRecibo";
                    await connection.ExecuteAsync(clearDefaultSql, new { TipoRecibo = tipoRecibo }, transaction);

                    // Establecer la nueva plantilla como por defecto
                    var setDefaultSql = "UPDATE ReceiptTemplates SET PorDefecto = 1, FechaModificacion = GETDATE() WHERE Id = @Id";
                    await connection.ExecuteAsync(setDefaultSql, new { Id = id }, transaction);

                    transaction.Commit();
                    return Ok(new { message = "Plantilla establecida como predeterminada" });
                }
                catch
                {
                    transaction.Rollback();
                    throw;
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al establecer plantilla por defecto", error = ex.Message });
            }
        }

        // POST: api/ReceiptTemplates/duplicate/5
        [HttpPost("duplicate/{id}")]
        public async Task<IActionResult> Duplicate(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                
                // Obtener la plantilla original
                var getTemplateSql = "SELECT * FROM ReceiptTemplates WHERE Id = @Id";
                var original = await connection.QueryFirstOrDefaultAsync<ReceiptTemplate>(getTemplateSql, new { Id = id });
                
                if (original == null)
                    return NotFound(new { message = "Plantilla no encontrada" });

                // Crear copia
                var insertSql = @"INSERT INTO ReceiptTemplates 
                                 (Nombre, Descripcion, TipoRecibo, AnchoMM, PrinterName, ConfiguracionJSON, Activo, PorDefecto, Usuario)
                                 VALUES (@Nombre, @Descripcion, @TipoRecibo, @AnchoMM, @PrinterName, @ConfiguracionJSON, 1, 0, @Usuario);
                                 SELECT CAST(SCOPE_IDENTITY() as int)";
                
                var newId = await connection.QuerySingleAsync<int>(insertSql, new
                {
                    Nombre = $"{original.Nombre} (Copia)",
                    original.Descripcion,
                    original.TipoRecibo,
                    original.AnchoMM,
                    original.PrinterName,
                    original.ConfiguracionJSON,
                    Usuario = "Sistema"
                });

                return Ok(new { id = newId, message = "Plantilla duplicada exitosamente" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al duplicar plantilla", error = ex.Message });
            }
        }
    }
}
