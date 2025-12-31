using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;
using System.Text;
using System.Dynamic;

namespace PosCrono.API.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly string _connectionString;

        public ReportsController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        }

        [HttpGet("Cotizacion")]
        public async Task<IActionResult> PrintCotizacion(int id)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var master = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM CotizacionesMaster WHERE Id = @Id", new { Id = id });

                    if (master == null) return NotFound("Cotización no encontrada");

                    var details = await connection.QueryAsync<dynamic>(
                        @"SELECT d.*, a.NumeroArticulo 
                          FROM CotizacionesDetalle d
                          LEFT JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                          WHERE d.CotizacionId = @Id", new { Id = id });

                    var client = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM Clients WHERE Id = @Id", new { Id = master.ClienteId });

                    var html = GenerateHtmlReport("COTIZACIÓN", master, details, client, "blue");
                    return Content(html, "text/html");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Reports Error] {ex}");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("Factura")]
        public async Task<IActionResult> PrintFactura(int id)
        {
             try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var master = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM VentasMaster WHERE Id = @Id", new { Id = id });

                    if (master == null) return NotFound("Venta no encontrada");

                    var details = await connection.QueryAsync<dynamic>(
                        @"SELECT d.*, a.NumeroArticulo 
                          FROM VentasDetalle d
                          LEFT JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                          WHERE d.VentaId = @Id", new { Id = id });

                    var client = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM Clients WHERE Id = @Id", new { Id = master.ClienteId });

                    dynamic? ncfInfo = null;
                    string ncfValue = GetProp(master, "NCF");
                    if (!string.IsNullOrEmpty(ncfValue))
                    {
                        var prefix = ncfValue.Length >= 3 ? ncfValue.Substring(0, 3) : "";
                        ncfInfo = await connection.QueryFirstOrDefaultAsync<dynamic>(
                            "SELECT Nombre, FechaVencimiento FROM NCF_Secuencias WHERE Prefijo = @Prefix", new { Prefix = prefix });
                    }

                    var html = GenerateHtmlReport("FACTURA", master, details, client, "orange", ncfInfo);
                    return Content(html, "text/html");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Reports Error] {ex}");
                return StatusCode(500, ex.Message);
            }
        }

        [HttpGet("Devolucion")]
        public async Task<IActionResult> PrintDevolucion(int id)
        {
             try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    var master = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM ReturnsMaster WHERE Id = @Id", new { Id = id });

                    if (master == null) return NotFound("Devolución no encontrada");

                    var details = await connection.QueryAsync<dynamic>(
                        @"SELECT d.*, a.NumeroArticulo, a.Descripcion
                          FROM ReturnsDetail d
                          LEFT JOIN ArticulosMaster a ON d.ArticuloId = a.Id
                          WHERE d.ReturnId = @Id", new { Id = id });

                    var ventaOrigen = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM VentasMaster WHERE Id = @Id", new { Id = master.VentaId });

                    var client = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM Clients WHERE Id = @Id", new { Id = ventaOrigen?.ClienteId ?? 0 });

                    var cn = await connection.QueryFirstOrDefaultAsync<dynamic>(
                        "SELECT * FROM CreditNotes WHERE ReturnId = @Id", new { Id = id });
                    
                    dynamic? ncfInfo = null;
                    if (cn != null)
                    {
                        string cnNcf = GetProp(cn, "NCF");
                        if (!string.IsNullOrEmpty(cnNcf))
                        {
                            var prefix = cnNcf.Length >= 3 ? cnNcf.Substring(0, 3) : "";
                            var ncfData = await connection.QueryFirstOrDefaultAsync<dynamic>(
                                "SELECT Nombre, FechaVencimiento FROM NCF_Secuencias WHERE Prefijo = @Prefix", new { Prefix = prefix });
                            
                            if (ncfData != null)
                            {
                                ncfInfo = ncfData;
                                ncfInfo.NCF = cnNcf;
                            }
                            else
                            {
                                ncfInfo = new ExpandoObject();
                                ncfInfo.NCF = cnNcf;
                                ncfInfo.Nombre = "Nota de Crédito";
                                ncfInfo.FechaVencimiento = DateTime.Now.AddYears(1);
                            }
                        }
                    }

                    var html = GenerateHtmlReport("NOTA DE CRÉDITO", master, details, client, "red", ncfInfo, ventaOrigen);
                    return Content(html, "text/html");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Reports Error] {ex}");
                return StatusCode(500, "Error buscando devolución: " + ex.Message);
            }
        }

        private string GenerateHtmlReport(string title, dynamic master, IEnumerable<dynamic> details, dynamic client, string colorTheme, dynamic? ncfInfo = null, dynamic? originDoc = null)
        {
            var sb = new StringBuilder();
            
            string primaryColor = colorTheme == "blue" ? "#005a9e" : (colorTheme == "red" ? "#a80000" : "#d83b01");
            string secondaryText = "#605e5c";
            string borderColor = "#edebe9";

            string ncfStr = GetProp(ncfInfo, "NCF") ?? GetProp(master, "NCF") ?? GetProp(master, "TipoNCF") ?? "";
            string ncfName = GetProp(ncfInfo, "Nombre") ?? (title == "COTIZACIÓN" ? "" : (ncfStr.StartsWith("B01") ? "Crédito Fiscal" : "Consumo"));
            
            var expiryRaw = GetProp(ncfInfo, "FechaVencimiento");
            string ncfExpiry = expiryRaw is DateTime dt ? dt.ToString("dd/MM/yyyy") : "31/12/2026";
            
            string docNumber = GetProp(master, "NumeroFactura") ?? GetProp(master, "Secuencia") ?? GetProp(master, "Id")?.ToString() ?? "0";
            if (title == "NOTA DE CRÉDITO" && !string.IsNullOrEmpty(ncfStr)) docNumber = ncfStr;

            sb.Append($@"
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='UTF-8'>
    <title>{title} - {docNumber}</title>
    <style>
        @page {{ size: letter; margin: 0.5in; }}
        body {{ font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #323130; line-height: 1.4; margin: 0; padding: 20px; }}
        .professional-layout {{ max-width: 800px; margin: 0 auto; }}
        .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }}
        .logo-area {{ flex: 1; }}
        .logo-text {{ font-size: 28px; font-weight: 800; color: {primaryColor}; letter-spacing: -0.5px; margin: 0; }}
        .company-details {{ font-size: 11px; color: #605e5c; margin-top: 5px; }}
        .document-title-area {{ text-align: right; }}
        .document-title {{ font-size: 24px; font-weight: 300; color: {primaryColor}; text-transform: uppercase; margin: 0; }}
        .document-type-subtitle {{ font-size: 12px; font-weight: 600; color: {secondaryText}; margin-bottom: 5px; }}
        .document-meta {{ margin-top: 10px; font-size: 12px; }}
        .meta-row {{ display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 2px; }}
        .meta-label {{ font-weight: 600; color: #605e5c; }}
        .info-grid {{ display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; margin-bottom: 30px; }}
        .section-heading {{ font-size: 10px; font-weight: 700; text-transform: uppercase; color: {primaryColor}; border-bottom: 1px solid {borderColor}; padding-bottom: 5px; margin-bottom: 10px; }}
        .info-block {{ font-size: 12px; }}
        .info-row {{ margin-bottom: 4px; }}
        .details-table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
        .details-table th {{ background: #f3f2f1; font-size: 11px; font-weight: 600; text-align: left; padding: 10px; border-bottom: 2px solid {borderColor}; }}
        .details-table td {{ padding: 10px; border-bottom: 1px solid {borderColor}; font-size: 12px; }}
        .details-table tr:nth-child(even) {{ background: #faf9f8; }}
        .summary-area {{ display: flex; justify-content: flex-end; }}
        .totals-table {{ width: 250px; font-size: 13px; }}
        .total-row {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid {borderColor}; }}
        .total-row.grand-total {{ border-bottom: none; border-top: 2px solid {primaryColor}; margin-top: 5px; padding-top: 10px; font-weight: 700; font-size: 16px; color: {primaryColor}; }}
        .footer {{ margin-top: 60px; font-size: 10px; color: {secondaryText}; border-top: 1px solid {borderColor}; padding-top: 20px; }}
        .signature-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 100px; margin-top: 40px; }}
        .signature-line {{ border-top: 1px solid #323130; text-align: center; padding-top: 5px; font-size: 11px; }}
        @media print {{ body {{ padding: 0; }} .no-print {{ border: none; }} }}
    </style>
</head>
<body>
    <div class='professional-layout'>
        <div class='header'>
            <div class='logo-area'>
                <p class='logo-text'>CIGAR COUNTRY</p>
                <div class='company-details'>
                    CIGAR COUNTRY PUNTA CANA<br>
                    Autopista del Coral, Punta Cana, RD<br>
                    <strong>RNC: 1-31-01234-5</strong> | Tel: (809) 555-5555
                </div>
            </div>
            <div class='document-title-area'>
                {(string.IsNullOrEmpty(ncfName) ? "" : $"<div class='document-type-subtitle'>{ncfName}</div>")}
                <h1 class='document-title'>{title}</h1>
                <div class='document-meta'>
                    <div class='meta-row'><span class='meta-label'>Número:</span> <span>{docNumber}</span></div>
                    <div class='meta-row'><span class='meta-label'>Fecha:</span> <span>{GetProp(master, "Fecha"):dd/MM/yyyy}</span></div>
                    {(!string.IsNullOrEmpty(ncfStr) ? $@"<div class='meta-row'><span class='meta-label'>NCF:</span> <span>{ncfStr}</span></div>" : "")}
                    {(!string.IsNullOrEmpty(ncfStr) && title != "COTIZACIÓN" ? $@"<div class='meta-row'><span class='meta-label'>Válido Hasta:</span> <span>{ncfExpiry}</span></div>" : "")}
                </div>
            </div>
        </div>

        <div class='info-grid'>
            <div class='info-block'>
                <div class='section-heading'>Información del Cliente</div>
                <div class='info-row'><strong>Nombre:</strong> {GetProp(client, "Name") ?? GetProp(client, "Nombre") ?? "Cliente de Contado"}</div>
                <div class='info-row'><strong>RNC/Cédula:</strong> {GetProp(client, "TaxId") ?? GetProp(client, "RNC") ?? "N/A"}</div>
                <div class='info-row'><strong>Dirección:</strong> {GetProp(client, "Address") ?? "Santo Domingo, República Dominicana"}</div>
                <div class='info-row'><strong>Teléfono:</strong> {GetProp(client, "Phone") ?? ""}</div>
            </div>
            <div class='info-block'>
                <div class='section-heading'>Términos y Condiciones</div>
                <div class='info-row'><strong>Condición:</strong> {GetProp(master, "TerminosPago") ?? GetProp(master, "CondicionPago") ?? "Contado"}</div>
                <div class='info-row'><strong>Vendedor:</strong> {GetProp(master, "Usuario") ?? "Admin"}</div>
                <div class='info-row'><strong>Moneda:</strong> DOP (Peso Dominicano)</div>
                { (title == "NOTA DE CRÉDITO" ? $@"<div class='info-row'><strong>Afecta Factura:</strong> {GetProp(originDoc, "NumeroFactura") ?? GetProp(originDoc, "Secuencia") ?? "N/A"}</div>" : "")}
            </div>
        </div>

        <table class='details-table'>
            <thead>
                <tr>
                    <th style='width: 15%'>CÓDIGO</th>
                    <th>DESCRIPCIÓN</th>
                    <th style='text-align: right; width: 10%'>CANT</th>
                    <th style='text-align: right; width: 15%'>PRECIO UNIT.</th>
                    <th style='text-align: right; width: 15%'>TOTAL BRUTO</th>
                </tr>
            </thead>
            <tbody>");

            foreach (var item in details)
            {
                decimal price = (decimal)(GetProp(item, "Precio") ?? GetProp(item, "PrecioUnitario") ?? 0m);
                decimal qty = (decimal)(GetProp(item, "Cantidad") ?? 0m);
                decimal lineTotal = (qty * price);

                sb.Append($@"
                <tr>
                    <td>{GetProp(item, "NumeroArticulo") ?? GetProp(item, "ArticuloCodigo") ?? GetProp(item, "ArticuloId")?.ToString()}</td>
                    <td>{GetProp(item, "Descripcion")}</td>
                    <td style='text-align: right'>{qty:N1}</td>
                    <td style='text-align: right'>{price:N2}</td>
                    <td style='text-align: right'>{lineTotal:N2}</td>
                </tr>");
            }

            sb.Append($@"
            </tbody>
        </table>

        <div class='summary-area'>
            <div class='totals-table'>
                <div class='total-row'>
                    <span>Subtotal</span>
                    <span>{(decimal)(GetProp(master, "Subtotal") ?? 0m):N2}</span>
                </div>
                <div class='total-row'>
                    <span>ITBIS (18%)</span>
                    <span>{(decimal)(GetProp(master, "Impuestos") ?? GetProp(master, "ITBIS") ?? 0m):N2}</span>
                </div>");

            decimal desc = (decimal)(GetProp(master, "DescuentoTotal") ?? 0m);
            if (desc > 0)
            {
                sb.Append($@"
                <div class='total-row'>
                    <span>Descuento</span>
                    <span>-{desc:N2}</span>
                </div>");
            }

            sb.Append($@"
                <div class='total-row grand-total'>
                    <span>TOTAL</span>
                    <span>RD$ {(decimal)(GetProp(master, "Total") ?? 0m):N2}</span>
                </div>
            </div>
        </div>

        <div class='signature-grid'>
            <div class='signature-line'>Autorizado Por</div>
            <div class='signature-line'>Recibido Conforme</div>
        </div>

        <div class='footer'>
            <p>* Este documento es una representación digital de una transacción interna.<br>
            * Gracias por elegir CIGAR COUNTRY para sus necesidades de distribución.</p>
        </div>
    </div>

    <script>
        window.onload = function() {{ 
             window.print(); 
        }}
    </script>
</body>
</html>");

            return sb.ToString();
        }

        private static dynamic? GetProp(dynamic obj, string name)
        {
            if (obj == null) return null;
            if (obj is IDictionary<string, object> dict)
            {
                return dict.TryGetValue(name, out var val) ? val : null;
            }
            // For other types, try reflection or just return null to be safe
            try {
                return obj.GetType().GetProperty(name)?.GetValue(obj, null);
            } catch { return null; }
        }
    }
}
