using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("DocumentSequences")]
    public class DocumentSequence
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Code { get; set; } // SALES_INVOICE, PURCHASE_ORDER, GOODS_RECEIPT

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [StringLength(10)]
        public string Prefix { get; set; }

        public int CurrentValue { get; set; } = 0;

        public int Length { get; set; } = 6;
        
        public DateTime LastModified { get; set; } = DateTime.Now;

        // Helper
        public string GenerateNext()
        {
            return $"{Prefix}{(CurrentValue + 1).ToString().PadLeft(Length, '0')}";
        }
    }
}
