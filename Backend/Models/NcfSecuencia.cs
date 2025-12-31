using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("NCF_Secuencias")]
    public class NcfSecuencia
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string TipoNCF { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Nombre { get; set; }

        [StringLength(10)]
        public string? Prefijo { get; set; }

        public int Desde { get; set; } = 1;
        
        public int Hasta { get; set; } = 100000;
        
        public int Actual { get; set; } = 0;
        
        public bool Activo { get; set; } = true;

        public DateTime? FechaVencimiento { get; set; }
    }
}
