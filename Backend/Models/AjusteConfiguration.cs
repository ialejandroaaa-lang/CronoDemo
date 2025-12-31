using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PosCrono.API.Models
{
    public class AjusteConfiguration
    {
        [Key]
        public int Id { get; set; }
        
        [StringLength(50)]
        [JsonPropertyName("defaultPlanId")]
        public string? DefaultPlanId { get; set; }

        [StringLength(20)]
        [JsonPropertyName("defaultUnit")]
        public string? DefaultUnit { get; set; }
    }
}
