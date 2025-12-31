using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    public class PromotionCoupon
    {
        [Key]
        [MaxLength(50)]
        public string Code { get; set; }

        public int PromotionId { get; set; }

        public int? MaxUses { get; set; }
        public int UsedCount { get; set; } = 0;
        public int? CustomerId { get; set; }
        public bool IsActive { get; set; } = true;

        [ForeignKey("PromotionId")]
        public Promotion Promotion { get; set; }
    }
}
