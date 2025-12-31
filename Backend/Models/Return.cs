using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace PosCrono.API.Models
{
    [Table("ReturnsMaster")]
    public class Return
    {
        [Key]
        public int Id { get; set; }

        public int VentaId { get; set; }

        public DateTime Fecha { get; set; } = DateTime.Now;

        [StringLength(50)]
        public string Estado { get; set; } = "Pendiente"; // Pendiente, Completado, Anulado

        [StringLength(200)]
        public string? Razon { get; set; }

        [StringLength(50)]
        public string TipoAccion { get; set; } = "Reembolso"; // Reembolso, Credito, Cambio

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalReembolsado { get; set; }

        [StringLength(100)]
        public string? Usuario { get; set; }

        // Navigation Properties
        /* [ForeignKey("VentaId")]
        public VentaMaster VentaOriginal { get; set; } */ // Optional, keeping it simple to avoid circular deps if VentaMaster not fully defined yet here
        
        [NotMapped]
        public List<ReturnDetail> Detalles { get; set; } = new List<ReturnDetail>();
    }
}
