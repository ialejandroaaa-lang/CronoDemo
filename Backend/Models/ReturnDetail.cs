using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("ReturnsDetail")]
    public class ReturnDetail
    {
        [Key]
        public int Id { get; set; }

        public int ReturnId { get; set; }

        public int ArticuloId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Cantidad { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecioUnitario { get; set; }

        public bool RetornarAlStock { get; set; } = true;
    }
}
