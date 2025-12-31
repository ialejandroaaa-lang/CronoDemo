using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;
using Dapper;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticuloConfigurationController : ControllerBase
    {
        private readonly string _connectionString;

        public ArticuloConfigurationController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // GET: api/ArticuloConfiguration
        [HttpGet]
        public async Task<IActionResult> GetConfiguration()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        SELECT TOP 1 
                            Prefijo, 
                            SiguienteNumero, 
                            LongitudMinima, 
                            PermitirEdicion, 
                            UsarSecuenciaPorGrupo,
                            CategoriaDefecto,
                            UnidadMedidaDefecto,
                            PlanDefecto,
                            RequiereCodBarras,
                            ActivarPorDefecto,
                            RutaImagenesDefecto
                        FROM ArticuloConfiguracion
                        ORDER BY Id DESC
                    ", connection);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            var config = new
                            {
                                prefijo = reader["Prefijo"]?.ToString() ?? "",
                                siguienteNumero = reader["SiguienteNumero"]?.ToString() ?? "00001",
                                longitudMinima = Convert.ToInt32(reader["LongitudMinima"]),
                                permitirEdicion = Convert.ToBoolean(reader["PermitirEdicion"]),
                                usarSecuenciaPorGrupo = Convert.ToBoolean(reader["UsarSecuenciaPorGrupo"]),
                                categoriaDefecto = reader["CategoriaDefecto"]?.ToString(),
                                unidadMedidaDefecto = reader["UnidadMedidaDefecto"]?.ToString(),
                                planDefecto = reader["PlanDefecto"]?.ToString(),
                                requiereCodBarras = Convert.ToBoolean(reader["RequiereCodBarras"]),
                                activarPorDefecto = Convert.ToBoolean(reader["ActivarPorDefecto"]),
                                rutaImagenesDefecto = reader["RutaImagenesDefecto"]?.ToString() ?? "",
                                formatoEjemplo = $"{reader["Prefijo"]}{new string('0', Convert.ToInt32(reader["LongitudMinima"]))}"
                            };
                            
                            return Ok(config);
                        }
                    }
                }
                
                return NotFound("No configuration found");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving configuration", error = ex.Message });
            }
        }

        // POST: api/ArticuloConfiguration
        [HttpPost]
        public async Task<IActionResult> SaveConfiguration([FromBody] ArticuloConfigDto config)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        UPDATE ArticuloConfiguracion
                        SET Prefijo = @Prefijo,
                            SiguienteNumero = @SiguienteNumero,
                            LongitudMinima = @LongitudMinima,
                            PermitirEdicion = @PermitirEdicion,
                            UsarSecuenciaPorGrupo = @UsarSecuenciaPorGrupo,
                            CategoriaDefecto = @CategoriaDefecto,
                            UnidadMedidaDefecto = @UnidadMedidaDefecto,
                            PlanDefecto = @PlanDefecto,
                            RequiereCodBarras = @RequiereCodBarras,
                            ActivarPorDefecto = @ActivarPorDefecto,
                            RutaImagenesDefecto = @RutaImagenesDefecto,
                            FechaModificacion = GETDATE()
                        WHERE Id = (SELECT TOP 1 Id FROM ArticuloConfiguracion ORDER BY Id DESC)
                    ", connection);

                    command.Parameters.AddWithValue("@Prefijo", config.Prefijo ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@SiguienteNumero", config.SiguienteNumero);
                    command.Parameters.AddWithValue("@LongitudMinima", config.LongitudMinima);
                    command.Parameters.AddWithValue("@PermitirEdicion", config.PermitirEdicion);
                    command.Parameters.AddWithValue("@UsarSecuenciaPorGrupo", config.UsarSecuenciaPorGrupo);
                    command.Parameters.AddWithValue("@CategoriaDefecto", config.CategoriaDefecto ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@UnidadMedidaDefecto", config.UnidadMedidaDefecto ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@PlanDefecto", config.PlanDefecto ?? (object)DBNull.Value);
                    command.Parameters.AddWithValue("@RequiereCodBarras", config.RequiereCodBarras);
                    command.Parameters.AddWithValue("@ActivarPorDefecto", config.ActivarPorDefecto);
                    command.Parameters.AddWithValue("@RutaImagenesDefecto", config.RutaImagenesDefecto ?? (object)DBNull.Value);

                    await command.ExecuteNonQueryAsync();
                }

                return Ok(new { message = "Configuration saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving configuration", error = ex.Message });
            }
        }

        // GET: api/ArticuloConfiguration/SecuenciasPorGrupo
        [HttpGet("SecuenciasPorGrupo")]
        public async Task<IActionResult> GetSecuenciasPorGrupo()
        {
            try
            {
                var secuencias = new List<object>();
                
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();
                    
                    var command = new SqlCommand(@"
                        SELECT 
                            Id,
                            GrupoProducto,
                            Prefijo,
                            SiguienteNumero,
                            LongitudMinima,
                            Activo,
                            EsDefecto,
                            PlanDefecto,
                            UnidadMedidaDefecto
                        FROM ArticuloSecuenciaPorGrupo

                        ORDER BY GrupoProducto
                    ", connection);

                    using (var reader = await command.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            secuencias.Add(new
                            {
                                id = Convert.ToInt32(reader["Id"]),
                                grupo = reader["GrupoProducto"].ToString(),
                                prefijo = reader["Prefijo"]?.ToString() ?? "",
                                siguienteNumero = reader["SiguienteNumero"].ToString(),
                                longitudMinima = Convert.ToInt32(reader["LongitudMinima"]),
                                activo = Convert.ToBoolean(reader["Activo"]),
                                esDefecto = reader["EsDefecto"] != DBNull.Value && Convert.ToBoolean(reader["EsDefecto"]),
                                planDefecto = reader["PlanDefecto"]?.ToString(),
                                unidadMedidaDefecto = reader["UnidadMedidaDefecto"]?.ToString()
                            });
                        }
                    }
                }

                return Ok(secuencias);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving sequences", error = ex.Message });
            }
        }

        // POST: api/ArticuloConfiguration/SecuenciasPorGrupo
        [HttpPost("SecuenciasPorGrupo")]
        public async Task<IActionResult> SaveSecuenciasPorGrupo([FromBody] List<SecuenciaGrupoDto> secuencias)
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
                            var deleteCommand = new SqlCommand("DELETE FROM ArticuloSecuenciaPorGrupo", connection, transaction);
                            await deleteCommand.ExecuteNonQueryAsync();

                            // Insert new sequences
                            foreach (var sec in secuencias)
                            {
                                var insertCommand = new SqlCommand(@"
                                    INSERT INTO ArticuloSecuenciaPorGrupo 
                                    (GrupoProducto, Prefijo, SiguienteNumero, LongitudMinima, Activo, EsDefecto, PlanDefecto, UnidadMedidaDefecto)
                                    VALUES (@GrupoProducto, @Prefijo, @SiguienteNumero, @LongitudMinima, @Activo, @EsDefecto, @PlanDefecto, @UnidadMedidaDefecto)
                                ", connection, transaction);

                                insertCommand.Parameters.AddWithValue("@GrupoProducto", sec.Grupo);
                                insertCommand.Parameters.AddWithValue("@Prefijo", sec.Prefijo ?? (object)DBNull.Value);
                                insertCommand.Parameters.AddWithValue("@SiguienteNumero", sec.SiguienteNumero);
                                insertCommand.Parameters.AddWithValue("@LongitudMinima", sec.LongitudMinima);
                                insertCommand.Parameters.AddWithValue("@Activo", sec.Activo);
                                insertCommand.Parameters.AddWithValue("@EsDefecto", sec.EsDefecto);
                                insertCommand.Parameters.AddWithValue("@PlanDefecto", string.IsNullOrEmpty(sec.PlanDefecto) ? (object)DBNull.Value : sec.PlanDefecto);
                                insertCommand.Parameters.AddWithValue("@UnidadMedidaDefecto", string.IsNullOrEmpty(sec.UnidadMedidaDefecto) ? (object)DBNull.Value : sec.UnidadMedidaDefecto);

                                await insertCommand.ExecuteNonQueryAsync();
                            }

                            transaction.Commit();
                        }
                        catch
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }



                return Ok(new { message = "Sequences saved successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error saving sequences", error = ex.Message });
            }
        }

        // POST: api/ArticuloConfiguration/GenerarNumeroArticulo
        [HttpPost("GenerarNumeroArticulo")]
        public async Task<IActionResult> GenerarNumeroArticulo([FromBody] GenerarNumeroRequest request)
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
                            // 1. Obtener la secuencia actual para el grupo
                            var selectCommand = new SqlCommand(@"
                                SELECT Id, Prefijo, SiguienteNumero, LongitudMinima
                                FROM ArticuloSecuenciaPorGrupo
                                WHERE GrupoProducto = @GrupoProducto AND Activo = 1
                            ", connection, transaction);

                            selectCommand.Parameters.AddWithValue("@GrupoProducto", request.GrupoProducto);

                            string numeroGenerado = "";
                            int secuenciaId = 0;
                            string prefijo = "";
                            string siguienteNumero = "";
                            int longitudMinima = 5;

                            using (var reader = await selectCommand.ExecuteReaderAsync())
                            {
                                if (await reader.ReadAsync())
                                {
                                    secuenciaId = Convert.ToInt32(reader["Id"]);
                                    prefijo = reader["Prefijo"]?.ToString() ?? "";
                                    siguienteNumero = reader["SiguienteNumero"]?.ToString() ?? "00001";
                                    longitudMinima = Convert.ToInt32(reader["LongitudMinima"]);
                                }
                                else
                                {
                                    return NotFound(new { message = $"No se encontró secuencia activa para el grupo '{request.GrupoProducto}'" });
                                }
                            }

                            // 2. Generar el número de artículo
                            numeroGenerado = $"{prefijo}{siguienteNumero.PadLeft(longitudMinima, '0')}";

                            // 3. Incrementar el siguiente número
                            int numeroActual = int.Parse(siguienteNumero);
                            int numeroSiguiente = numeroActual + 1;
                            string siguienteNumeroStr = numeroSiguiente.ToString().PadLeft(longitudMinima, '0');

                            // 4. Actualizar la secuencia
                            var updateCommand = new SqlCommand(@"
                                UPDATE ArticuloSecuenciaPorGrupo
                                SET SiguienteNumero = @SiguienteNumero,
                                    FechaModificacion = GETDATE()
                                WHERE Id = @Id
                            ", connection, transaction);

                            updateCommand.Parameters.AddWithValue("@SiguienteNumero", siguienteNumeroStr);
                            updateCommand.Parameters.AddWithValue("@Id", secuenciaId);

                            await updateCommand.ExecuteNonQueryAsync();

                            transaction.Commit();

                            return Ok(new { 
                                numeroArticulo = numeroGenerado,
                                siguienteNumero = siguienteNumeroStr
                            });
                        }
                        catch
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generando número de artículo", error = ex.Message });
            }
        }
    }

    // DTOs
    public class ArticuloConfigDto
    {
        public string? Prefijo { get; set; }
        public string SiguienteNumero { get; set; } = "00001";
        public int LongitudMinima { get; set; } = 5;
        public bool PermitirEdicion { get; set; }
        public bool UsarSecuenciaPorGrupo { get; set; }
        public string? CategoriaDefecto { get; set; }
        public string? UnidadMedidaDefecto { get; set; }
        public string? PlanDefecto { get; set; }
        public bool RequiereCodBarras { get; set; }
        public bool ActivarPorDefecto { get; set; } = true;
        public string? RutaImagenesDefecto { get; set; }
    }

    public class SecuenciaGrupoDto
    {
        public int? Id { get; set; }
        public string Grupo { get; set; } = "";
        public string? Prefijo { get; set; }
        public string SiguienteNumero { get; set; } = "00001";
        public int LongitudMinima { get; set; } = 5;
        public bool Activo { get; set; } = true;

        public bool EsDefecto { get; set; }
        public string? PlanDefecto { get; set; }
        public string? UnidadMedidaDefecto { get; set; }
    }

    public class GenerarNumeroRequest
    {
        public string GrupoProducto { get; set; } = "";
    }
}
