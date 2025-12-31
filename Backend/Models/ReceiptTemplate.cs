using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("ReceiptTemplates")]
    public class ReceiptTemplate
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descripcion { get; set; }

        [Required]
        [StringLength(50)]
        public string TipoRecibo { get; set; } = "Venta";

        public int AnchoMM { get; set; } = 80;

        [StringLength(100)]
        public string? PrinterName { get; set; }

        [Required]
        public string ConfiguracionJSON { get; set; } = string.Empty;

        public bool Activo { get; set; } = true;

        public bool PorDefecto { get; set; } = false;

        public DateTime FechaCreacion { get; set; } = DateTime.Now;

        public DateTime FechaModificacion { get; set; } = DateTime.Now;

        [StringLength(50)]
        public string? Usuario { get; set; }
    }
}
