using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using PosCrono.API.Helpers;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AjustesController : ControllerBase
    {
        private readonly string _connectionString;

        public AjustesController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpPost]
        public async Task<IActionResult> CreateAjuste([FromBody] AjusteDto ajuste)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Keys
                    .SelectMany(key => ModelState[key].Errors.Select(x => new { Key = key, Error = x.ErrorMessage }))
                    .ToList();
                Console.WriteLine("[Ajustes Warning] Validation Failed:");
                foreach (var err in errors) Console.WriteLine($"  - {err.Key}: {err.Error}");
                return BadRequest(new { message = "Datos inválidos", errors });
            }

            if (ajuste.Detalles == null || !ajuste.Detalles.Any())
                return BadRequest(new { message = "El ajuste debe tener al menos un detalle." });

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Get Next Sequence
                var seqSql = "SELECT * FROM DocumentSequences WHERE Code = 'AJUSTE'";
                var sequence = await connection.QueryFirstOrDefaultAsync(seqSql, transaction: transaction);

                if (sequence == null)
                {
                    // Fallback create
                    await connection.ExecuteAsync("INSERT INTO DocumentSequences (Code, Name, Prefix, CurrentValue, Length, LastModified) VALUES ('AJUSTE', 'Ajuste de Inventario', 'AJ-', 0, 6, GETDATE())", transaction: transaction);
                    sequence = await connection.QueryFirstOrDefaultAsync(seqSql, transaction: transaction);
                }

                // Increment Sequence
                var updateSeqSql = "UPDATE DocumentSequences SET CurrentValue = CurrentValue + 1, LastModified = GETDATE() WHERE Id = @Id";
                await connection.ExecuteAsync(updateSeqSql, new { Id = sequence.Id }, transaction);

                // Format Document Number (e.g., AJ-000001)
                var nextVal = (int)sequence.CurrentValue + 1;
                var docNumber = $"{sequence.Prefix}{nextVal.ToString().PadLeft(sequence.Length, '0')}";

                // 2. Insert Master
                var insertMasterSql = @"
                    INSERT INTO AjustesMaster (
                        NumeroDocumento, Fecha, TipoAjuste, MotivoId, AlmacenId, 
                        Observaciones, Usuario, FechaCreacion, Estado
                    ) VALUES (
                        @Doc, @Fecha, @Tipo, @MotivoId, @AlmacenId, 
                        @Obs, @User, GETDATE(), 'Completado'
                    );
                    SELECT CAST(SCOPE_IDENTITY() as int)";
                
                var masterId = await connection.QuerySingleAsync<int>(insertMasterSql, new {
                    Doc = docNumber,
                    Fecha = ajuste.Fecha,
                    Tipo = ajuste.TipoAjuste,
                    MotivoId = ajuste.MotivoId,
                    AlmacenId = ajuste.AlmacenId,
                    Obs = ajuste.Observaciones,
                    User = "Admin" // TODO: Context user
                }, transaction);

                // 3. Process Items
                foreach (var det in ajuste.Detalles)
                {
                    // Determine sign based on adjustment type
                    var factor = ajuste.TipoAjuste == "in" ? 1 : -1;
                    
                    // Quantity to adjust (Total Units = Qty * Equivalent)
                    var cantidadTotalUnidades = det.Cantidad * det.Equivalente;
                    var cantidadMovimiento = cantidadTotalUnidades * factor;

                    // Insert Detail
                    var insertDetailSql = @"
                        INSERT INTO AjustesDetalle (
                            AjusteId, ArticuloId, Cantidad, UnidadMedida, CostoUnitario, 
                            CantidadUnidad, PlanUoM, TotalUnidades
                        ) VALUES (
                            @AjusteId, @ArticuloId, @Cantidad, @Unidad, @Costo,
                            @Equivalente, @Plan, @Total
                        )";
                    
                    await connection.ExecuteAsync(insertDetailSql, new {
                        AjusteId = masterId,
                        ArticuloId = det.ArticuloId,
                        Cantidad = det.Cantidad,
                        Unidad = det.Unidad,
                        Costo = det.Costo,
                        Equivalente = det.Equivalente,
                        Plan = det.PlanUoM,
                        Total = cantidadTotalUnidades
                    }, transaction);

                    // Update Stock in Master
                    var updateStockSql = @"
                        UPDATE ArticulosMaster 
                        SET StockActual = StockActual + @Cantidad 
                        WHERE Id = @ArticuloId";
                    
                    await connection.ExecuteAsync(updateStockSql, new { 
                        Cantidad = cantidadMovimiento, 
                        ArticuloId = det.ArticuloId 
                    }, transaction);

                    // Insert Movement (Kardex)
                    var insertKardexSql = @"
                        INSERT INTO MovimientosInventario (
                            ArticuloId, FechaMovimiento, TipoMovimiento, 
                            Cantidad, CostoUnitario, Referencia, 
                            Usuario, AlmacenId, StockAnterior, StockNuevo, 
                            UnidadMedida, CantidadOriginal, UnidadOriginal, NumeroDocumento
                        ) 
                        SELECT 
                            @ArticuloId, @Fecha, @Motivo, 
                            @Cantidad, @Costo, @Referencia, 
                            @Usuario, @AlmacenId, 
                            (StockActual - @Cantidad), 
                            StockActual,
                            @Unidad, @CantidadOriginal, @UnidadOriginal, @DocNum
                        FROM ArticulosMaster WHERE Id = @ArticuloId";

                    await connection.ExecuteAsync(insertKardexSql, new {
                        ArticuloId = det.ArticuloId,
                        Fecha = ajuste.Fecha,
                        Motivo = "Ajuste", 
                        Cantidad = cantidadMovimiento,
                        Costo = det.Costo, 
                        Referencia = $"{docNumber} - {ajuste.MotivoDescripcion}",
                        Usuario = "Admin",
                        AlmacenId = ajuste.AlmacenId,
                        Unidad = "UND", // Base unit
                        CantidadOriginal = det.Cantidad * factor, // Sign included for logic? Or just abs? Usually abs in original field, sign in movement. Kardex logic varies but let's stick to signed movement qty.
                        UnidadOriginal = det.Unidad,
                        DocNum = docNumber
                    }, transaction);
                }

                transaction.Commit();

                // Audit Log
                await AuditHelper.LogAsync(connection, null, "AjustesMaster", masterId.ToString(), "INSERT", null, ajuste, "Admin");

                return Ok(new { message = "Ajuste registrado correctamente", documento = docNumber });
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                Console.WriteLine($"[Ajustes Error] CreateAjuste Exception: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                return StatusCode(500, new { message = "Error al procesar el ajuste", error = ex.Message });
            }
        }

        // GET: api/Ajustes - Retrieve recent adjustments (history)
        [HttpGet]
        public async Task<IActionResult> GetAjustes()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                // Fetch from Master table now!
                var sql = @"
                    SELECT TOP 100 
                        m.Id, 
                        m.NumeroDocumento AS Documento, 
                        m.Fecha, 
                        CASE WHEN m.TipoAjuste = 'in' THEN 'Entrada' ELSE 'Salida' END AS Tipo, 
                        mo.Motivo AS Motivo 
                    FROM AjustesMaster m
                    LEFT JOIN MotivosAjuste mo ON m.MotivoId = mo.Id
                    ORDER BY m.Fecha DESC";
                
                var ajustes = await connection.QueryAsync<AjusteHistDto>(sql);
                return Ok(ajustes);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ajustes Error] GetAjustes Exception: {ex.Message}");
                return StatusCode(500, new { message = "Error al obtener ajustes", error = ex.Message });
            }
        }

        // GET: api/Ajustes/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetAjuste(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();
                
                // Fetch Master
                var masterSql = @"
                    SELECT 
                        m.Id, 
                        m.NumeroDocumento AS Documento, 
                        m.Fecha, 
                        m.TipoAjuste, 
                        m.MotivoId,
                        mo.Motivo AS MotivoDescripcion,
                        m.AlmacenId, 
                        a.Nombre AS AlmacenNombre,
                        m.Observaciones,
                        m.Usuario,
                        m.Estado
                    FROM AjustesMaster m
                    LEFT JOIN MotivosAjuste mo ON m.MotivoId = mo.Id
                    LEFT JOIN Almacenes a ON m.AlmacenId = a.Id
                    WHERE m.Id = @Id";
                
                var master = await connection.QueryFirstOrDefaultAsync<AjusteFullDto>(masterSql, new { Id = id });

                if (master == null) return NotFound(new { message = "Ajuste no encontrado" });

                // Fetch Details
                var detailSql = @"
                    SELECT 
                        d.Id,
                        d.ArticuloId,
                        am.NumeroArticulo AS Codigo,
                        am.Descripcion,
                        d.Cantidad,
                        d.UnidadMedida AS Unidad,
                        d.CostoUnitario AS Costo,
                        d.PlanUoM,
                        d.CantidadUnidad AS Equivalente,
                        d.TotalUnidades
                    FROM AjustesDetalle d
                    INNER JOIN ArticulosMaster am ON d.ArticuloId = am.Id
                    WHERE d.AjusteId = @Id";

                var detalles = await connection.QueryAsync<AjusteDetalleFullDto>(detailSql, new { Id = id });
                master.Detalles = detalles.ToList();

                return Ok(master);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Ajustes Error] GetAjuste Exception: {ex.Message}");
                return StatusCode(500, new { message = "Error al obtener ajuste", error = ex.Message });
            }
        }

        public class AjusteFullDto
        {
            public int Id { get; set; }
            public string Documento { get; set; }
            public DateTime Fecha { get; set; }
            public string TipoAjuste { get; set; }
            public int MotivoId { get; set; }
            public string MotivoDescripcion { get; set; }
            public int AlmacenId { get; set; }
            public string AlmacenNombre { get; set; }
            public string Observaciones { get; set; }
            public string Usuario { get; set; }
            public string Estado { get; set; }
            public List<AjusteDetalleFullDto> Detalles { get; set; }
        }

        public class AjusteDetalleFullDto
        {
            public int Id { get; set; }
            public int ArticuloId { get; set; }
            public string Codigo { get; set; }
            public string Descripcion { get; set; }
            public decimal Cantidad { get; set; }
            public string Unidad { get; set; }
            public decimal Costo { get; set; }
            public string PlanUoM { get; set; }
            public decimal Equivalente { get; set; }
            public decimal TotalUnidades { get; set; }
        }
        public class AjusteHistDto
        {
            public int Id { get; set; }
            public string Documento { get; set; }
            public DateTime Fecha { get; set; }
            public string Tipo { get; set; }
            public string Motivo { get; set; }
        }
    }

    public class AjusteDto
    {
        public DateTime Fecha { get; set; }
        public string TipoAjuste { get; set; } // 'in' or 'out'
        public int MotivoId { get; set; }
        public string MotivoDescripcion { get; set; } 
        public int AlmacenId { get; set; }
        public string Observaciones { get; set; }
        public List<AjusteDetalleDto> Detalles { get; set; }
    }

    public class AjusteDetalleDto
    {
        public int ArticuloId { get; set; }
        public string Codigo { get; set; }
        public string Descripcion { get; set; }
        public string Unidad { get; set; }
        public decimal Cantidad { get; set; }
        public decimal Equivalente { get; set; } = 1;
        public decimal Costo { get; set; }
        public string PlanUoM { get; set; }
    }
}
