using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace PosCrono.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FileSystemController : ControllerBase
    {
        [HttpGet("Drives")]
        public IActionResult GetDrives()
        {
            var drives = DriveInfo.GetDrives()
                .Where(d => d.IsReady)
                .Select(d => new { name = d.Name, label = d.Name });
            return Ok(drives);
        }

        [HttpGet("Browse")]
        public IActionResult Browse(string path = "")
        {
            try
            {
                if (string.IsNullOrEmpty(path))
                {
                    // If no path, return drives
                    return GetDrives();
                }

                if (!Directory.Exists(path))
                    return BadRequest("Path does not exist");

                var directories = Directory.GetDirectories(path)
                    .Select(d => new { 
                        name = Path.GetFileName(d), 
                        fullPath = d,
                        type = "directory"
                    })
                    .OrderBy(d => d.name);

                return Ok(new {
                    currentPath = path,
                    parentPath = Path.GetDirectoryName(path),
                    items = directories
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error browsing directory", error = ex.Message });
            }
        }

        [HttpGet("NativeBrowse")]
        public IActionResult NativeBrowse()
        {
            try
            {
                // PowerShell script to open a modern folder browser dialog
                // Using OpenFileDialog hack to get the modern Explorer look
                string script = @"
                    Add-Type -AssemblyName System.Windows.Forms;
                    $f = New-Object System.Windows.Forms.OpenFileDialog;
                    $f.Title = 'Seleccione la carpeta de destino';
                    $f.Filter = 'Carpetas|*.none';
                    $f.CheckFileExists = $false;
                    $f.CheckPathExists = $true;
                    $f.ValidateNames = $false;
                    $f.FileName = 'SELECCIONAR CARPETA';
                    
                    $parent = New-Object System.Windows.Forms.Form;
                    $parent.TopMost = $true;
                    
                    $res = $f.ShowDialog($parent);
                    if($res -eq [System.Windows.Forms.DialogResult]::OK){ 
                        Write-Output ([System.IO.Path]::GetDirectoryName($f.FileName));
                    }
                ";
                
                var scriptBytes = System.Text.Encoding.Unicode.GetBytes(script);
                var encodedScript = Convert.ToBase64String(scriptBytes);

                var startInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = $"-NoProfile -STA -EncodedCommand {encodedScript}",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                using (var process = Process.Start(startInfo))
                {
                    if (process == null) return StatusCode(500, "Could not start powershell");

                    // Read output BEFORE waiting to avoid stream buffer issues
                    string output = process.StandardOutput.ReadToEnd().Trim();
                    
                    // Wait up to 5 minutes for the user
                    if (process.WaitForExit(300000)) 
                    {
                        if (!string.IsNullOrEmpty(output))
                        {
                            return Ok(new { path = output });
                        }
                    }
                    else
                    {
                        process.Kill();
                        return StatusCode(408, "El explorador tardó demasiado en responder (tiempo límite 5 min)");
                    }

                    return NoContent(); // Cancelled
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error al abrir el explorador", error = ex.Message });
            }
        }
    }
}
