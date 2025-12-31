using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace PosCrono.API.Controllers
{
    [Route("api/SqlMetadata")]
    [ApiController]
    public class SqlMetadataController : ControllerBase
    {
        private readonly string _connectionString;

        public SqlMetadataController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
        }

        [HttpGet("Ping")]
        public IActionResult Ping()
        {
            return Ok(new { status = "ok", message = "SqlMetadataController is alive", time = DateTime.Now });
        }

        [HttpGet("Views")]
        public async Task<IActionResult> GetViews()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                // Solo vistas, no tablas
                var sql = @"
                    SELECT name as [Name], 'View' as [Type] 
                    FROM sys.views 
                    WHERE name NOT LIKE 'sys%'
                    ORDER BY name";
                
                var result = await connection.QueryAsync(sql);
                var views = result.ToList();
                Console.WriteLine($"[SqlMetadata] Se encontraron {views.Count} vistas.");
                foreach(var v in views) Console.WriteLine($" - {v.Name}");
                
                return Ok(views);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SqlMetadata Error] GetViews: {ex.Message}");
                return StatusCode(500, new { message = "Error al obtener vistas", error = ex.Message });
            }
        }

        [HttpGet("Views/{viewName}/Columns")]
        public async Task<IActionResult> GetColumns(string viewName)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                var sql = @"
                    SELECT 
                        c.name as [Name],
                        t.name as [Type],
                        c.max_length as [MaxLength],
                        c.is_nullable as [IsNullable]
                    FROM sys.columns c
                    JOIN sys.types t ON c.user_type_id = t.user_type_id
                    WHERE c.object_id = OBJECT_ID(@ViewName)";
                
                var columns = await connection.QueryAsync(sql, new { ViewName = viewName });
                return Ok(columns);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SqlMetadata Error] GetColumns: {ex.Message}");
                return StatusCode(500, new { message = "Error al obtener columnas", error = ex.Message });
            }
        }

        [HttpGet("Execute/{viewName}")]
        public async Task<IActionResult> ExecuteView(string viewName, [FromQuery] string filterField, [FromQuery] string filterValue)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                
                // Better validation logging
                if (string.IsNullOrWhiteSpace(viewName) || viewName.Contains(";") || viewName.Contains("--"))
                {
                    Console.WriteLine($"[SqlMetadata Error] Invalid View Name: {viewName}");
                    return BadRequest($"Nombre de vista inválido: {viewName}");
                }

                if (!string.IsNullOrEmpty(filterField) && (filterField.Contains(";") || filterField.Contains("--")))
                {
                     Console.WriteLine($"[SqlMetadata Error] Invalid Filter Field: {filterField}");
                     return BadRequest("Campo de filtro inválido");
                }

                // Ensure it's treated as a view/table name safely (basic cleanup)
                var safeViewName = viewName.Replace("[", "").Replace("]", "");

                string sql = $"SELECT TOP 1 * FROM [{safeViewName}]";
                if (!string.IsNullOrEmpty(filterField) && !string.IsNullOrEmpty(filterValue))
                {
                    var safeFilterField = filterField.Replace("[", "").Replace("]", "");
                    sql += $" WHERE [{safeFilterField}] = @Value";
                    var result = await connection.QueryFirstOrDefaultAsync(sql, new { Value = filterValue });
                    return Ok(result);
                }
                else
                {
                    var result = await connection.QueryFirstOrDefaultAsync(sql);
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SqlMetadata Error] ExecuteView: {ex.Message} | Stack: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error al ejecutar vista " + viewName, error = ex.Message });
            }
        }
    }
}
