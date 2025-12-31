using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("Clients")]
    public class Client
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(10)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(100)]
        public string Company { get; set; } = string.Empty;

        [StringLength(20)]
        public string? TaxId { get; set; }

        [StringLength(20)]
        public string? Phone { get; set; }

        [StringLength(100)]
        public string? Email { get; set; }

        [StringLength(200)]
        public string? Address { get; set; }

        [StringLength(20)]
        public string? Status { get; set; } = "Active";

        [Column(TypeName = "decimal(18,2)")]
        public decimal? Balance { get; set; }

        [StringLength(100)]
        public string? SellerName { get; set; }

        [StringLength(10)]
        public string? TipoNCF { get; set; }

        [StringLength(50)]
        public string? NivelPrecio { get; set; }

        [StringLength(10)]
        public string? Moneda { get; set; }

    }
}
