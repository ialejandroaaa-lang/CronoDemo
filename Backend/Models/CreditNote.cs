using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("CreditNotes")]
    public class CreditNote
    {
        [Key]
        public int Id { get; set; }

        public int ClienteId { get; set; }

        public int? VentaOrigenId { get; set; }

        public int? ReturnId { get; set; }

        [StringLength(50)]
        public string? NCF { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Monto { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Saldo { get; set; }

        public DateTime Fecha { get; set; } = DateTime.Now;

        [StringLength(100)]
        public string? Usuario { get; set; }

        [StringLength(50)]
        public string Estado { get; set; } = "Activo"; // Activo, Usado, Anulado

        [StringLength(255)]
        public string? Concepto { get; set; }
    }
}
