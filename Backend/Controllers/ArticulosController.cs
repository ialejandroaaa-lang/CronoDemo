using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ArticulosController : ControllerBase
    {
        private readonly string _connectionString;

        public ArticulosController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        // POST: api/Articulos
        [HttpPost]
        public async Task<IActionResult> CreateArticulo([FromBody] ArticuloDto articulo)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    var sql = @"
                        INSERT INTO ArticulosMaster (
                            NumeroArticulo, CodigoBarras, Descripcion, 
                            GrupoProducto, Categoria, Marca, Tipo, 
                            UnidadMedida, AlmacenPrincipal, UbicacionAlmacen, 
                            MetodoCosteo, CostoUnitario, MargenPorcentaje, PrecioUnitario, 
                            NivelPrecio, GrupoImpuesto, 
                            SistemaReposicion, StockSeguridad, PuntoPedido, ProveedorPrincipal, 
                            Bloqueado, Activo, UsuarioCreacion, PlanMedida, CostoEstandar, ImagenUrl
                        ) VALUES (
                            @NumeroArticulo, @CodigoBarras, @Descripcion, 
                            @GrupoProducto, @Categoria, @Marca, @Tipo, 
                            @UnidadMedida, @AlmacenPrincipal, @UbicacionAlmacen, 
                            @MetodoCosteo, @CostoUnitario, @MargenPorcentaje, @PrecioUnitario, 
                            @NivelPrecio, @GrupoImpuesto, 
                            @SistemaReposicion, @StockSeguridad, @PuntoPedido, @ProveedorPrincipal, 
                            @Bloqueado, 1, 'Sistema', @PlanMedida, @CostoEstandar, @ImagenUrl
                        );
                        SELECT CAST(SCOPE_IDENTITY() as int);";

                    var id = await connection.QuerySingleAsync<int>(sql, articulo);

                    return Ok(new { message = "Artículo creado exitosamente", id = id });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al crear artículo", error = ex.Message });
            }
        }
        
        // GET: api/Articulos
        [HttpGet]
        public async Task<IActionResult> GetAllArticulos()
        {
            try
            {

                using (var connection = new SqlConnection(_connectionString))
                {
                    // 1. Fetch Articles
                    var sql = @"
                        SELECT 
                            Id, NumeroArticulo, CodigoBarras, Descripcion, 
                            GrupoProducto, Categoria, Marca, Tipo, 
                            UnidadMedida, AlmacenPrincipal, UbicacionAlmacen,
                            MetodoCosteo, CostoUnitario, MargenPorcentaje, PrecioUnitario,
                            NivelPrecio, GrupoImpuesto, SistemaReposicion, 
                            StockSeguridad, PuntoPedido, ProveedorPrincipal,
                            ISNULL(StockActual, 0) as StockActual,
                            PlanMedida, CostoEstandar,
                            Activo, Bloqueado, FechaCreacion, ImagenUrl
                        FROM ArticulosMaster 
                        WHERE Activo = 1 
                        ORDER BY FechaCreacion DESC";
                    
                    var articulos = (await connection.QueryAsync<ArticuloDto>(sql)).ToList();

                    if (!articulos.Any()) 
                        return Ok(articulos);

                    // 2. Fetch All Prices for Active Articles
                    // Optimization: Only fetch prices for the active articles we just fetched
                    // Given we fetched 'WHERE Activo = 1', we can limit prices join
                    var sqlPrecios = @"
                        SELECT p.* 
                        FROM ArticulosPrecios p
                        INNER JOIN ArticulosMaster a ON p.ArticuloId = a.Id
                        WHERE a.Activo = 1 AND p.Activo = 1";
                    
                    var allPrecios = (await connection.QueryAsync<PrecioDto>(sqlPrecios)).ToList();
                    var preciosLookup = allPrecios.ToLookup(p => p.ArticuloId);

                    // 3. Map Prices to Articles
                    foreach (var a in articulos)
                    {
                        var precios = preciosLookup[a.Id].ToList();
                        a.PreciosList = precios;
                        a.MonedasDisponibles = precios
                            .Select(p => p.Moneda ?? "DOP")
                            .Distinct()
                            .ToList();
                    }

                    return Ok(articulos);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Articulos Warning] GetAllArticulos Exception: {ex.Message}");
                return StatusCode(500, new { message = "Error al obtener artículos", error = ex.Message });
            }
        }
        
        // GET: api/Articulos/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetArticulo(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = "SELECT * FROM ArticulosMaster WHERE Id = @Id";
                    var articulo = await connection.QuerySingleOrDefaultAsync<ArticuloDto>(sql, new { Id = id });

                    if (articulo == null)
                        return NotFound();

                    return Ok(articulo);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener artículo", error = ex.Message });
            }
        }

        // PUT: api/Articulos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArticulo(int id, [FromBody] ArticuloDto articulo)
        {
            if (id != articulo.Id) return BadRequest();

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        UPDATE ArticulosMaster 
                        SET 
                            Descripcion = @Descripcion,
                            GrupoProducto = @GrupoProducto,
                            Categoria = @Categoria,
                            Marca = @Marca,
                            Tipo = @Tipo,
                            UnidadMedida = @UnidadMedida,
                            AlmacenPrincipal = @AlmacenPrincipal,
                            UbicacionAlmacen = @UbicacionAlmacen,
                            GrupoImpuesto = @GrupoImpuesto,
                            MargenPorcentaje = @MargenPorcentaje,
                            CostoUnitario = @CostoUnitario,
                            PrecioUnitario = @PrecioUnitario,
                            NivelPrecio = @NivelPrecio,
                            StockSeguridad = @StockSeguridad,
                            PuntoPedido = @PuntoPedido,
                            ProveedorPrincipal = @ProveedorPrincipal,
                            Bloqueado = @Bloqueado,
                            PlanMedida = @PlanMedida,
                            CostoEstandar = @CostoEstandar,
                            MetodoCosteo = @MetodoCosteo,
                            ImagenUrl = @ImagenUrl
                        WHERE Id = @Id";
                    
                    await connection.ExecuteAsync(sql, articulo);
                    return NoContent();
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar artículo", error = ex.Message });
            }
        }

        // DELETE: api/Articulos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArticulo(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = "UPDATE ArticulosMaster SET Activo = 0 WHERE Id = @Id";
                    await connection.ExecuteAsync(sql, new { Id = id });
                    return Ok(new { message = "Artículo eliminado (desactivado) exitosamente" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al eliminar artículo", error = ex.Message });
            }
        }

        // GET: api/Articulos/{id}/Precios
        [HttpGet("{id}/Precios")]
        public async Task<IActionResult> GetPrecios(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = "SELECT * FROM ArticulosPrecios WHERE ArticuloId = @ArticuloId";
                    var precios = await connection.QueryAsync<PrecioDto>(sql, new { ArticuloId = id });
                    return Ok(precios);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener precios", error = ex.Message });
            }
        }

        // POST: api/Articulos/{id}/Precios
        [HttpPost("{id}/Precios")]
        public async Task<IActionResult> SavePrecios(int id, [FromBody] List<PrecioDto> precios)
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
                            // Delete existing prices
                            var deleteSql = "DELETE FROM ArticulosPrecios WHERE ArticuloId = @ArticuloId";
                            await connection.ExecuteAsync(deleteSql, new { ArticuloId = id }, transaction);

                            // Insert new prices
                            var insertSql = @"
                                INSERT INTO ArticulosPrecios (
                                    ArticuloId, NivelPrecio, UnidadMedida, CantidadInicial, 
                                    Porcentaje, Precio, Moneda, Activo, FechaModificacion
                                ) VALUES (
                                    @ArticuloId, @NivelPrecio, @UnidadMedida, @CantidadInicial, 
                                    @Porcentaje, @Precio, @Moneda, @Activo, GETDATE()
                                )";

                            foreach (var p in precios)
                            {
                                p.ArticuloId = id; // Ensure ID matches URL
                                await connection.ExecuteAsync(insertSql, p, transaction);
                            }

                            transaction.Commit();
                            return Ok(new { message = "Precios actualizados exitosamente" });
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar precios", error = ex.Message });
            }
        }

        [HttpPost("CopyPrecios")]
        public async Task<IActionResult> CopyPrecios([FromBody] CopyPreciosDto dto)
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
                            // 1. Delete existing prices for target
                            var deleteSql = "DELETE FROM ArticulosPrecios WHERE ArticuloId = @TargetArticuloId";
                            await connection.ExecuteAsync(deleteSql, new { dto.TargetArticuloId }, transaction);

                            // 2. Copy prices from source to target
                            // We select from source, replace ArticuloId with TargetArticuloId, and insert.
                            var copySql = @"
                                INSERT INTO ArticulosPrecios (
                                    ArticuloId, NivelPrecio, UnidadMedida, CantidadInicial, 
                                    Porcentaje, Precio, Moneda, Activo, FechaCreacion, FechaModificacion
                                )
                                SELECT 
                                    @TargetArticuloId, NivelPrecio, UnidadMedida, CantidadInicial,
                                    Porcentaje, Precio, Moneda, Activo, GETDATE(), GETDATE()
                                FROM ArticulosPrecios
                                WHERE ArticuloId = @SourceArticuloId";

                            var rowsAffected = await connection.ExecuteAsync(copySql, new { dto.TargetArticuloId, dto.SourceArticuloId }, transaction);

                            transaction.Commit();
                            return Ok(new { message = $"Precios copiados exitosamente. {rowsAffected} niveles creados." });
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al copiar precios", error = ex.Message });
            }
        }

        [HttpPost("{id}/QuickStock")]
        public async Task<IActionResult> QuickStockUpdate(int id, [FromBody] QuickStockDto dto)
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
                            // 1. Update StockActual
                            var sqlUpdate = "UPDATE ArticulosMaster SET StockActual = StockActual + @Qty WHERE Id = @Id";
                            await connection.ExecuteAsync(sqlUpdate, new { Qty = dto.Cantidad, Id = id }, transaction);

                            // 2. Record Movement (Kardex)
                            var sqlKardex = @"
                                INSERT INTO MovimientosInventario (
                                    ArticuloId, FechaMovimiento, TipoMovimiento, 
                                    Cantidad, CostoUnitario, Referencia, 
                                    Usuario, AlmacenId, StockAnterior, StockNuevo, UnidadMedida
                                ) SELECT 
                                    @Id, GETDATE(), 'Ajuste Manual', @Qty, CostoUnitario, 'ALIMENTACION MANUAL', 
                                    'Sistema', @AlmacenId, StockActual - @Qty, StockActual, UnidadMedida
                                FROM ArticulosMaster WHERE Id = @Id";
                            
                            await connection.ExecuteAsync(sqlKardex, new { 
                                Id = id, 
                                Qty = dto.Cantidad, 
                                AlmacenId = dto.AlmacenId 
                            }, transaction);

                            transaction.Commit();
                            return Ok(new { message = "Inventario alimentado correctamente." });
                        }
                        catch (Exception) { transaction.Rollback(); throw; }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al actualizar stock", error = ex.Message });
            }
        }
        [HttpGet("{id}/Stock")]
        public async Task<IActionResult> GetStock(int id, [FromQuery] int? almacenId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    // Calculate stock from movements for specific warehouse
                    // Handling legacy schema where AlmacenId might be varchar or int
                    var sql = @"
                        SELECT ISNULL(SUM(Cantidad), 0)
                        FROM MovimientosInventario
                        WHERE ArticuloId = @Id
                        AND (@AlmacenId IS NULL 
                             OR AlmacenId = CAST(@AlmacenId AS VARCHAR(50)) 
                             OR AlmacenId = @AlmacenIdStr -- fallback for string comparison
                             OR (@AlmacenId = 1 AND AlmacenId = 'Principal')
                            )";

                    var stock = await connection.ExecuteScalarAsync<decimal>(sql, new { Id = id, AlmacenId = almacenId, AlmacenIdStr = almacenId?.ToString() });
                    return Ok(new { Stock = stock });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener stock", error = ex.Message });
            }
        }
        [HttpGet("{id}/StockBreakdown")]
        public async Task<IActionResult> GetStockBreakdown(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    // Group by AlmacenId to get current stock per warehouse
                    var sql = @"
                        SELECT 
                            m.AlmacenId,
                            SUM(m.Cantidad) as Cantidad
                        FROM MovimientosInventario m
                        WHERE m.ArticuloId = @Id
                        GROUP BY m.AlmacenId
                        HAVING SUM(m.Cantidad) != 0";

                    var result = await connection.QueryAsync(sql, new { Id = id });
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener desglose de stock", error = ex.Message });
            }
        }

        [HttpGet("StockGlobal")]
        public async Task<IActionResult> GetStockGlobal()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            ArticuloId,
                            AlmacenId, 
                            SUM(Cantidad) as Cantidad 
                        FROM MovimientosInventario
                        GROUP BY ArticuloId, AlmacenId";
                    var result = await connection.QueryAsync(sql);
                    return Ok(result);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener stock global", error = ex.Message });
            }
        }

        [HttpGet("ReportePrecios")]
        public async Task<IActionResult> GetReportePrecios()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT 
                            a.NumeroArticulo, 
                            a.Descripcion, 
                            a.UnidadMedida, 
                            a.CostoEstandar, 
                            a.CostoUnitario,
                            p.NivelPrecio, 
                            p.Precio, 
                            p.Moneda,
                            p.UnidadMedida as UnidadPrecio
                        FROM ArticulosMaster a
                        LEFT JOIN ArticulosPrecios p ON a.Id = p.ArticuloId
                        WHERE a.Activo = 1 AND p.Activo = 1
                        ORDER BY a.Descripcion, p.NivelPrecio";

                    var report = await connection.QueryAsync<ReportePrecioItemDto>(sql);
                    return Ok(report);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al generar reporte de precios", error = ex.Message });
            }
        }

        [HttpGet("NavigationList")]
        public async Task<IActionResult> GetNavigationList()
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var sql = @"
                        SELECT Id, Descripcion, NumeroArticulo
                        FROM ArticulosMaster 
                        WHERE Activo = 1 
                        ORDER BY Descripcion";
                    
                    var list = await connection.QueryAsync(sql);
                    return Ok(list);
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener lista de navegación", error = ex.Message });
            }
        }
        [HttpPost("{id}/RecalculateStock")]
        public async Task<IActionResult> RecalculateStock(int id)
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
                            // 1. Get Current Stock (Before Recalc)
                            var sqlGetOld = "SELECT StockActual FROM ArticulosMaster WHERE Id = @Id";
                            var oldStock = await connection.QuerySingleAsync<decimal>(sqlGetOld, new { Id = id }, transaction);

                            // 2. Fetch All Movements for Detailed Report
                            var sqlMovs = @"
                                SELECT * 
                                FROM MovimientosInventario 
                                WHERE ArticuloId = @Id 
                                ORDER BY FechaMovimiento, Id";
                            
                            var movs = (await connection.QueryAsync<dynamic>(sqlMovs, new { Id = id }, transaction)).ToList();

                            decimal realStock = 0;
                            decimal totalEntradas = 0;
                            decimal totalSalidas = 0;
                            decimal totalComprasValue = 0;
                            decimal entradasRecepcionValue = 0;

                            foreach (var m in movs)
                            {
                                decimal qty = (decimal)m.Cantidad;
                                string tipo = (string)m.TipoMovimiento;
                                
                                m.StockAnterior = realStock; // Record stock before this movement
                                realStock += qty; // Update running stock balance
                                m.StockNuevo = realStock; // Record stock after this movement

                                // PERSIST the calculated balances to the movement row
                                var sqlUpdateMov = "UPDATE MovimientosInventario SET StockAnterior = @StockAnterior, StockNuevo = @StockNuevo WHERE Id = @Id";
                                await connection.ExecuteAsync(sqlUpdateMov, new { StockAnterior = m.StockAnterior, StockNuevo = m.StockNuevo, Id = m.Id }, transaction);

                                // Update totals
                                if (qty > 0) totalEntradas += qty;
                                else totalSalidas += Math.Abs(qty);

                                // Specific KPIs for the report
                                if (string.Equals(tipo, "Compra", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(tipo, "Recepcion", StringComparison.OrdinalIgnoreCase) ||
                                    string.Equals(tipo, "Entrada", StringComparison.OrdinalIgnoreCase))
                                {
                                    if (qty > 0) totalComprasValue += qty;
                                }

                                if (string.Equals(tipo, "Recepcion", StringComparison.OrdinalIgnoreCase))
                                {
                                    if (qty > 0) entradasRecepcionValue += qty;
                                }
                            }

                            // 3. Update Master
                            var sqlUpdate = "UPDATE ArticulosMaster SET StockActual = @Stock WHERE Id = @Id";
                            await connection.ExecuteAsync(sqlUpdate, new { Stock = realStock, Id = id }, transaction);

                            transaction.Commit();

                            return Ok(new { 
                                message = "Stock recalculado correctamente", 
                                stockAnterior = oldStock,
                                nuevoStock = realStock,
                                diferencia = realStock - oldStock,
                                totalEntradas = totalEntradas,
                                totalSalidas = totalSalidas,
                                totalCompras = totalComprasValue,
                                entradasRecepcion = entradasRecepcionValue,
                                movimientos = movs // List of all movements for the report
                            });
                        }
                        catch (Exception)
                        {
                            transaction.Rollback();
                            throw;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al recalcula stock", error = ex.Message });
            }
        }
    }

    public class ArticuloDto
    {
        public int Id { get; set; }
        public string NumeroArticulo { get; set; }
        public string? CodigoBarras { get; set; }
        public string Descripcion { get; set; }
        public string? GrupoProducto { get; set; }
        public string? Categoria { get; set; }
        public string? Marca { get; set; }
        public string? Tipo { get; set; }
        public string UnidadMedida { get; set; } = "UND";
        public string? AlmacenPrincipal { get; set; }
        public string? UbicacionAlmacen { get; set; }
        public string? MetodoCosteo { get; set; }
        public decimal CostoUnitario { get; set; }
        public decimal MargenPorcentaje { get; set; }
        public decimal PrecioUnitario { get; set; }
        public string? NivelPrecio { get; set; }
        public string? GrupoImpuesto { get; set; }
        public string? SistemaReposicion { get; set; }
        public decimal StockSeguridad { get; set; }
        public decimal StockActual { get; set; }
        public decimal PuntoPedido { get; set; }
        public string? ProveedorPrincipal { get; set; }
        public bool Bloqueado { get; set; }
        public string? PlanMedida { get; set; }
        public decimal CostoEstandar { get; set; }
        public string? ImagenUrl { get; set; }
        public List<string> MonedasDisponibles { get; set; } = new List<string>();
        public List<PrecioDto> PreciosList { get; set; } = new List<PrecioDto>();
    }

    public class PrecioDto
    {
        public int Id { get; set; }
        public int ArticuloId { get; set; }
        public string NivelPrecio { get; set; }
        public string UnidadMedida { get; set; }
        public decimal CantidadInicial { get; set; }
        public decimal Porcentaje { get; set; }
        public decimal Precio { get; set; }
        public string Moneda { get; set; }
        public bool Activo { get; set; }
    }

    public class QuickStockDto {
        public decimal Cantidad { get; set; }
        public int AlmacenId { get; set; }
    }

    public class CopyPreciosDto
    {
        public int SourceArticuloId { get; set; }
        public int TargetArticuloId { get; set; }
    }

    public class ReportePrecioItemDto
    {
        public string NumeroArticulo { get; set; }
        public string Descripcion { get; set; }
        public string UnidadMedida { get; set; }
        public decimal CostoEstandar { get; set; }
        public decimal CostoUnitario { get; set; }
        public string NivelPrecio { get; set; }
        public decimal Precio { get; set; }
        public string Moneda { get; set; }
        public string UnidadPrecio { get; set; }
    }
}
