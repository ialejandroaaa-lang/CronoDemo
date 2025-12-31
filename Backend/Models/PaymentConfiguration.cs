using System.ComponentModel.DataAnnotations;

namespace PosCrono.API.Models
{
    public class PaymentConfiguration
    {
        [Key]
        public int Id { get; set; }

        // Payment Receipt Sequencing
        public bool UseAutoSequence { get; set; } = true;
        public string? Prefix { get; set; } = "PAGO-";
        public int SequenceLength { get; set; } = 6;
        public int CurrentValue { get; set; } = 0;
        public string? Separator { get; set; } = "-";

        // Logic Helpers
        public string GenerateNextCode()
        {
            string numberPart = (CurrentValue + 1).ToString().PadLeft(SequenceLength, '0');
            return $"{Prefix}{numberPart}";
        }
    }
}
