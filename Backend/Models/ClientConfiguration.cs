using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("ClientConfigurations")]
    public class ClientConfiguration
    {
        [Key]
        public int Id { get; set; }

        public bool UseAutoSequence { get; set; } = true;
        
        public bool UseInitials { get; set; } = false;
        
        [StringLength(10)]
        public string Initials { get; set; } = "CL";
        
        public int SequenceLength { get; set; } = 4; // e.g., 0001
        
        public int CurrentValue { get; set; } = 1;

        [StringLength(5)]
        public string Separator { get; set; } = "-";

        // Name case option: "words" (each word capitalized), "first" (first letter only), "normal" (no change)
        public string NameCase { get; set; } = "words";

        public bool AllowNegativeStock { get; set; } = false;

        // Logic to generate next code
        public string GenerateNextCode()
        {
            string numberPart = CurrentValue.ToString().PadLeft(SequenceLength, '0');
            if (UseInitials)
            {
                return $"{Initials}{Separator}{numberPart}";
            }
            return numberPart;
        }
    }
}
