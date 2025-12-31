using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    public class PromotionRule
    {
        [Key]
        public int Id { get; set; }

        public int PromotionId { get; set; }
        
        [Required]
        [MaxLength(50)]
        public string Type { get; set; } // 'MinTotal', 'ProductCategory', etc.

        [Required]
        [MaxLength(20)]
        public string Operator { get; set; } // 'GreaterThan', 'Equals'

        [Required]
        public string Value { get; set; } // JSON or simple string

        public int Group { get; set; } = 0;

        [ForeignKey("PromotionId")]
        [JsonIgnore]
        public Promotion? Promotion { get; set; }
    }
}
