using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EstadoCuentaController : ControllerBase
    {
        private readonly string _connectionString;

        public EstadoCuentaController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        [HttpGet("{proveedorId}")]
        public async Task<IActionResult> GetEstadoCuenta(int proveedorId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    // 1. Pending Invoices
                    var sqlPendientes = @"
                        SELECT c.*, m.Simbolo as MonedaSimbolo 
                        FROM ComprasMaster c
                        JOIN Monedas m ON c.MonedaId = m.Id
                        WHERE c.ProveedorId = @Id AND c.Saldo > 0 AND c.Estado <> 'Anulado' 
                        ORDER BY c.FechaCompra ASC";

                    // 2. Invoice History (Last 50)
                    var sqlHistorial = @"
                        SELECT TOP 50 c.*, m.Simbolo as MonedaSimbolo 
                        FROM ComprasMaster c
                        JOIN Monedas m ON c.MonedaId = m.Id
                        WHERE c.ProveedorId = @Id 
                        ORDER BY c.FechaCompra DESC";

                    // 3. Payment History (Last 50)
                    var sqlPagos = @"
                        SELECT TOP 50 p.*, m.Simbolo as MonedaSimbolo 
                        FROM PagosMaster p
                        JOIN Monedas m ON p.MonedaId = m.Id
                        WHERE ProveedorId = @Id 
                        ORDER BY Fecha DESC";

                    // 3.5. Debit/Credit Notes (Last 50)
                    var sqlNotas = @"
                        SELECT TOP 50 n.*, m.Simbolo as MonedaSimbolo 
                        FROM NotasMaster n
                        JOIN Monedas m ON n.MonedaId = m.Id
                        WHERE ProveedorId = @Id 
                        ORDER BY Fecha DESC";

                    var pendientes = await connection.QueryAsync<dynamic>(sqlPendientes, new { Id = proveedorId });
                    var historial = await connection.QueryAsync<dynamic>(sqlHistorial, new { Id = proveedorId });
                    var pagos = (await connection.QueryAsync<dynamic>(sqlPagos, new { Id = proveedorId })).ToList();
                    var notas = (await connection.QueryAsync<dynamic>(sqlNotas, new { Id = proveedorId })).ToList();

                    // 4. Fetch details for each payment
                    var pagosWithDetails = new List<dynamic>();
                    foreach (var pago in pagos)
                    {
                        var sqlDetails = @"
                            SELECT c.NumeroCompra as Numero, d.MontoAplicado as Monto
                            FROM PagosDetalle d
                            JOIN ComprasMaster c ON d.CompraId = c.Id
                            WHERE d.PagoId = @PagoId";

                        var detalles = await connection.QueryAsync<dynamic>(sqlDetails, new { PagoId = pago.Id });
                        
                        pagosWithDetails.Add(new {
                            Id = pago.Id,
                            Fecha = pago.Fecha,
                            Referencia = pago.Referencia,
                            Metodo = pago.Metodo,
                            Monto = pago.Monto,
                            MonedaSimbolo = pago.MonedaSimbolo,
                            Estado = pago.Estado,
                            FacturasAfectadas = detalles
                        });
                    }

                    // 4.5. Fetch details for each note
                    var notasWithDetails = new List<dynamic>();
                    foreach (var nota in notas)
                    {
                        var sqlNoteDetails = @"
                            SELECT c.NumeroCompra as Numero, d.MontoAplicado as Monto
                            FROM NotasDetalle d
                            JOIN ComprasMaster c ON d.CompraId = c.Id
                            WHERE d.NotaId = @NotaId";

                        var detalles = await connection.QueryAsync<dynamic>(sqlNoteDetails, new { NotaId = nota.Id });
                        
                        notasWithDetails.Add(new {
                            Id = nota.Id,
                            Fecha = nota.Fecha,
                            Tipo = nota.Tipo,
                            Referencia = nota.Referencia,
                            Monto = nota.Monto,
                            MonedaSimbolo = nota.MonedaSimbolo,
                            Comentario = nota.Comentario,
                            Estado = nota.Estado,
                            FacturasAfectadas = detalles
                        });
                    }

                    return Ok(new
                    {
                        Pendientes = pendientes,
                        Historial = historial,
                        Pagos = pagosWithDetails,
                        Notas = notasWithDetails
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al obtener estado de cuenta", error = ex.Message });
            }
        }
    }
}
