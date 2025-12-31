using Microsoft.AspNetCore.Mvc;
using System.Drawing.Printing;
using System.Collections.Generic;
using System.Linq;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrintersController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetPrinters()
        {
            try
            {
                var printers = new List<string>();
                foreach (string printer in PrinterSettings.InstalledPrinters)
                {
                    printers.Add(printer);
                }
                return Ok(printers.OrderBy(p => p));
            }
            catch (Exception ex)
            {
                // Fallback for non-Windows or permissions issues
                Console.WriteLine($"Error listing printers: {ex.Message}");
                return Ok(new List<string>()); 
            }
        }
    }
}
