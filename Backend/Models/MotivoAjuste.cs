using System.ComponentModel.DataAnnotations;

namespace PosCrono.API.Models
{
    public class MotivoAjuste
    {
        public int Id { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Grupo { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Codigo { get; set; }
        
        [Required]
        [MaxLength(200)]
        public string Motivo { get; set; }
        
        public bool Activo { get; set; } = true;
        
        // Future proofing for authorization requirement
        public bool RequiereAutorizacion { get; set; } = false;
    }
}
