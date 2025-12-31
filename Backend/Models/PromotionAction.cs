using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    public class PromotionAction
    {
        [Key]
        public int Id { get; set; }

        public int PromotionId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } // 'DiscountPercentage', 'FreeItem'

        [Column(TypeName = "decimal(18,2)")]
        public decimal Value { get; set; }

        [Required]
        [MaxLength(50)]
        public string AppliesTo { get; set; } // 'Order', 'SpecificProduct'

        public string? TargetArtifact { get; set; } // ProductId or CategoryId

        [ForeignKey("PromotionId")]
        [JsonIgnore]
        public Promotion? Promotion { get; set; }
    }
}
