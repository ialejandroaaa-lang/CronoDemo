using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosCrono.API.Data;
using PosCrono.API.Models;
using Dapper;
using Microsoft.Data.SqlClient;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClientsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Clients
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Client>>> GetClients()
        {
            try
            {
                return await _context.Clients.ToListAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    message = "Debug Error", 
                    details = ex.Message, 
                    inner = ex.InnerException?.Message 
                });
            }
        }

        // GET: api/Clients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Client>> GetClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);

            if (client == null)
            {
                return NotFound();
            }

            return client;
        }

        // POST: api/Clients
        [HttpPost]
        public async Task<ActionResult<Client>> PostClient(Client client)
        {
            // Apply name case formatting based on configuration
            var config = await _context.ClientConfigurations.FirstOrDefaultAsync();
            if (config != null && !string.IsNullOrEmpty(config.NameCase))
            {
                client.Name = ApplyNameCase(client.Name, config.NameCase);
            }

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            // If auto-sequence is enabled, increment the current value
            if (config != null && config.UseAutoSequence)
            {
                config.CurrentValue++;
                await _context.SaveChangesAsync();
            }

            return CreatedAtAction("GetClient", new { id = client.Id }, client);
        }

        // PUT: api/Clients/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutClient(int id, Client client)
        {
            if (id != client.Id)
            {
                return BadRequest();
            }

            // Apply name case formatting based on configuration
            var config = await _context.ClientConfigurations.FirstOrDefaultAsync();
            if (config != null && !string.IsNullOrEmpty(config.NameCase))
            {
                client.Name = ApplyNameCase(client.Name, config.NameCase);
            }

            Console.WriteLine($"[PutClient] Updating ID: {id}. Name: {client.Name}, Moneda: {client.Moneda}, Status: {client.Status}");

            _context.Entry(client).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClientExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Clients/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ClientExists(int id)
        {
            return _context.Clients.Any(e => e.Id == id);
        }

        // Helper to apply name case formatting based on configuration
        private string ApplyNameCase(string name, string caseOption)
        {
            if (string.IsNullOrWhiteSpace(name)) return name;
            switch (caseOption?.ToLower())
            {
                case "words":
                    var words = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    for (int i = 0; i < words.Length; i++)
                    {
                        var w = words[i];
                        if (w.Length > 0)
                        {
                            words[i] = char.ToUpper(w[0]) + w.Substring(1).ToLower();
                        }
                    }
                    return string.Join(' ', words);
                case "first":
                    return char.ToUpper(name[0]) + name.Substring(1).ToLower();
                case "normal":
                default:
                    return name;
            }
        }

        [HttpGet("{id}/Statement")]
        public async Task<IActionResult> GetClientStatement(int id)
        {
            try
            {
                var connectionString = _context.Database.GetDbConnection().ConnectionString;
                using var db = new SqlConnection(connectionString);

                var sql = @"
                    /* 1. Facturas (Ventas) -> DEBITO */
                    SELECT 
                        v.Fecha,
                        'Factura' as Tipo,
                        v.NumeroFactura as Documento,
                        '' as Referencia,
                        v.Total as Debito,
                        0 as Credito,
                        v.Id as RefId
                    FROM VentasMaster v
                    WHERE v.ClienteId = @ClientId AND v.Estado <> 'Anulado'

                    UNION ALL

                    /* 2. Cobros (Pagos) -> CREDITO */
                    SELECT 
                        c.Fecha,
                        'Cobro' as Tipo,
                        c.NumeroCobro as Documento,
                        c.Referencia,
                        0 as Debito,
                        c.Monto as Credito,
                        c.Id as RefId
                    FROM CobrosMaster c
                    WHERE c.ClienteId = @ClientId

                    UNION ALL

                    /* 3. Notas de Crédito -> CREDITO */
                    SELECT 
                        nc.Fecha,
                        'Nota Crédito' as Tipo,
                        nc.NCF as Documento,
                        nc.Concepto as Referencia,
                        0 as Debito,
                        nc.Monto as Credito,
                        nc.Id as RefId
                    FROM CreditNotes nc
                    WHERE nc.ClienteId = @ClientId AND nc.Estado <> 'Anulado'

                    ORDER BY Fecha DESC
                ";

                var movements = await db.QueryAsync<ClientStatementItem>(sql, new { ClientId = id });
                
                // Calculate Running Balance (from oldest to newest)
                // Since we fetched DESC for UI, we reverse for calculation or just calc logic
                // Standard: Start 0. Add Debit, Subtract Credit.
                
                var ordered = movements.OrderBy(x => x.Fecha).ToList();
                decimal runningBalance = 0;
                foreach(var mov in ordered)
                {
                    runningBalance += (mov.Debito - mov.Credito);
                    mov.Balance = runningBalance;
                }

                // Return ordered by Date DESC for viewing
                return Ok(ordered.OrderByDescending(x => x.Fecha));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error fetching statement", error = ex.Message });
            }
        }
        [HttpPost("Simulate/{name}")]
        public async Task<IActionResult> SimulateClients(string name)
        {
            try
            {
                // 1. Find the template client
                var template = await _context.Clients
                    .FirstOrDefaultAsync(c => c.Name.Contains(name));

                if (template == null)
                    return NotFound(new { message = $"No se encontró ningún cliente con nombre similar a '{name}'" });

                var created = new List<Client>();

                // 2. Create 10 copies
                for (int i = 1; i <= 10; i++)
                {
                    var newClient = new Client
                    {
                        Code = $"{template.Code}-{i}",
                        Name = $"{template.Name} (Simulado {i})",
                        Company = template.Company,
                        TaxId = template.TaxId,
                        Phone = template.Phone,
                        Email = template.Email,
                        Address = template.Address,
                        Status = "Active",
                        Balance = 0, // Reset balance
                        SellerName = template.SellerName,
                        TipoNCF = template.TipoNCF,
                        NivelPrecio = template.NivelPrecio,
                        Moneda = template.Moneda
                    };
                    _context.Clients.Add(newClient);
                    created.Add(newClient);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "10 clientes simulados creados", source = template.Name, totalCreated = created.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error simulando clientes", error = ex.Message });
            }
        }
    }

    public class ClientStatementItem
    {
        public DateTime Fecha { get; set; }
        public string Tipo { get; set; }
        public string Documento { get; set; }
        public string Referencia { get; set; }
        public decimal Debito { get; set; }
        public decimal Credito { get; set; }
        public decimal Balance { get; set; }
        public int RefId { get; set; }
    }
}

