using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("RecibosMaster")]
    public class RecibosMaster
    {
        [Key]
        public int Id { get; set; }

        public int VentaId { get; set; }

        [Required]
        [StringLength(50)]
        public string NumeroRecibo { get; set; } = string.Empty;

        public DateTime Fecha { get; set; } = DateTime.Now;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [StringLength(50)]
        public string? MetodoPago { get; set; }

        [StringLength(100)]
        public string? Referencia { get; set; }

        [StringLength(50)]
        public string? Usuario { get; set; }

        [StringLength(20)]
        public string Estado { get; set; } = "Activo";

        public DateTime FechaCreacion { get; set; } = DateTime.Now;
    }
}
