using System.ComponentModel.DataAnnotations;

namespace PosCrono.API.Models
{
    public class CompanyConfiguration
    {
        [Key]
        public int Id { get; set; }

        public string? NombreEmpresa { get; set; }
        public string? RNC { get; set; }
        public string? Direccion { get; set; }
        public string? Telefono { get; set; }
        public string? Correo { get; set; }
        public string? SitioWeb { get; set; }
        
        // Path to the uploaded logo file (relative to wwwroot)
        public string? LogoPath { get; set; }
        
        // Tax settings
        public decimal ImpuestoDefault { get; set; }
        public string? MonedaPrincipal { get; set; }
        
        // POS Configuration
        public int? DefaultClientId { get; set; }
    }
}
