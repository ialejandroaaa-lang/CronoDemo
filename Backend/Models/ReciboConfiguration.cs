using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PosCrono.API.Models
{
    [Table("ReciboConfiguration")]
    public class ReciboConfiguration
    {
        [Key]
        public int Id { get; set; }

        [StringLength(10)]
        public string Prefijo { get; set; } = "REC";

        public int SecuenciaActual { get; set; } = 0;

        public int Longitud { get; set; } = 6;

        public DateTime UltimaFechaModificacion { get; set; } = DateTime.Now;

        // Helper to generate next formatted number
        public string GenerateNext(bool increment = false)
        {
            int nextVal = SecuenciaActual + (increment ? 1 : 0);
            return $"{Prefijo}-{nextVal.ToString().PadLeft(Longitud, '0')}";
        }
    }
}
