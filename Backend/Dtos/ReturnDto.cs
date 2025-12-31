using System;
using System.Collections.Generic;

namespace PosCrono.API.Dtos
{
    public class ReturnDto
    {
        public int? Id { get; set; }
        public int VentaId { get; set; }
        public DateTime? Fecha { get; set; }
        public string? Estado { get; set; }
        public string? Razon { get; set; }
        public string TipoAccion { get; set; } = "Reembolso";
        public decimal TotalReembolsado { get; set; }
        public string? Usuario { get; set; }
        
        public List<ReturnDetailDto> Detalles { get; set; } = new List<ReturnDetailDto>();
    }

    public class ReturnDetailDto
    {
        public int ArticuloId { get; set; }
        public string? ArticuloDescripcion { get; set; } // For UI display
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public bool RetornarAlStock { get; set; } = true;
    }
}
