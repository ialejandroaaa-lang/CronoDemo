using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Dapper;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadController : ControllerBase
    {
        private readonly string _connectionString;
        private readonly IWebHostEnvironment _environment;

        public UploadController(IConfiguration configuration, IWebHostEnvironment environment)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
            _environment = environment;
        }

        private async Task<string> GetDefaultImagePath()
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var sql = "SELECT TOP 1 RutaImagenesDefecto FROM ArticuloConfiguracion ORDER BY Id DESC";
                var path = await connection.ExecuteScalarAsync<string>(sql);
                
                if (string.IsNullOrEmpty(path))
                {
                    path = Path.Combine(_environment.ContentRootPath, "wwwroot", "uploads", "products");
                }
                
                if (!Directory.Exists(path))
                {
                    Directory.CreateDirectory(path);
                }
                
                return path;
            }
        }

        [HttpPost("ProductImage")]
        public async Task<IActionResult> UploadProductImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                var targetPath = await GetDefaultImagePath();
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
                var filePath = Path.Combine(targetPath, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // We return the filename, the frontend will use the GET endpoint to show it
                return Ok(new { fileName = fileName, url = $"/api/Upload/Image/{fileName}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error uploading file", error = ex.Message });
            }
        }

        [HttpGet("Image/{fileName}")]
        public async Task<IActionResult> GetImage(string fileName)
        {
            try
            {
                var targetPath = await GetDefaultImagePath();
                var filePath = Path.Combine(targetPath, fileName);

                if (!System.IO.File.Exists(filePath))
                    return NotFound();

                var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
                if (!provider.TryGetContentType(filePath, out string contentType))
                {
                    contentType = "application/octet-stream";
                }

                return PhysicalFile(filePath, contentType);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error retrieving file", error = ex.Message });
            }
        }
    }
}
