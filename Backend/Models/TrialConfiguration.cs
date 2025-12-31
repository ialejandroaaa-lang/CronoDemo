using System.ComponentModel.DataAnnotations;

namespace PosCrono.API.Models
{
    public class TrialConfiguration
    {
        [Key]
        public int Id { get; set; }
        public DateTime InstallationDate { get; set; }
        public int TrialDays { get; set; } = 45;
        public bool IsActive { get; set; } = true;
        public string? LicenseKey { get; set; } // Opcional para futuro
    }
}
