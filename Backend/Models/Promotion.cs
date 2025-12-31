using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    public class Promotion
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; }

        [MaxLength(255)]
        public string Description { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

        public bool IsActive { get; set; } = true;
        public int Priority { get; set; } = 0;
        public bool RequiresCoupon { get; set; } = false;
        public bool AutoApply { get; set; } = true;
        public bool Stackable { get; set; } = false;
        
        [Required]
        [MaxLength(20)]
        public string ApplyTo { get; set; } = "Both"; // 'POS', 'Distribution', 'Both'

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Navigation Properties
        public List<PromotionRule> Rules { get; set; }
        public List<PromotionAction> Actions { get; set; }
    }
}
