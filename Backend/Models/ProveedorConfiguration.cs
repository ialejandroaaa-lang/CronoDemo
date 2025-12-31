using System.ComponentModel.DataAnnotations;

namespace PosCrono.API.Models
{
    public class ProveedorConfiguration
    {
        [Key]
        public int Id { get; set; }

        // Sequencing
        public bool UseAutoSequence { get; set; }
        public bool UseInitials { get; set; }
        public string Initials { get; set; }
        public int SequenceLength { get; set; }
        public int CurrentValue { get; set; }
        public string Separator { get; set; }

        // Rules
        public bool HabilitarFacturas { get; set; }
        public bool HabilitarPagoRecurrente { get; set; }

        // Payment Frequencies
        public bool HabilitarFrecuenciaSemanal { get; set; }
        public bool HabilitarFrecuenciaQuincenal { get; set; }
        public bool HabilitarFrecuenciaMensual { get; set; }
        public bool HabilitarFechasEspecificas { get; set; }

        public DateTime? LastModified { get; set; }

        public string GenerateNextCode()
        {
            string numberPart = CurrentValue.ToString().PadLeft(SequenceLength, '0');
            if (UseInitials && !string.IsNullOrEmpty(Initials))
            {
                return $"{Initials}{Separator}{numberPart}";
            }
            return numberPart;
        }
    }
}
